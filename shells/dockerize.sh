#!/bin/bash

########################
# This is for local testing only
#######################

#MODULE=$1
#AWS_PROFILE=$2

MODULE=$1           ## $npm_package_config_module_name
AWS_PROFILE=$2      ## $npm_package_config_aws_profile
AWS_BUCKET_ROOT=$3  ## $npm_package_config_aws_bucket_root
BUILD_NODE_ENV=$4
BUILD_NODE_ENV_ABBREV=$4

## if the environment is empty set a default
if [ -z "$4" ]; then
  echo "USING DEFAULT: Setting env to 'local'"
  BUILD_NODE_ENV="local"
  BUILD_NODE_ENV_ABBREV="local"
fi

## Set the abbreviated versions of things
if [[ "$BUILD_NODE_ENV" == "production" ]]; then
    BUILD_NODE_ENV_ABBREV='prod'
fi

## Debugging variables
echo "AWS_PROFILE: $AWS_PROFILE"
echo "MODULE: $MODULE"
echo "AWS_BUCKET_ROOT: $AWS_BUCKET_ROOT"
echo "BUILD_NODE_ENV: $BUILD_NODE_ENV" ## qa, develop, production, staging
echo "BUILD_NODE_ENV_ABBREV: $BUILD_NODE_ENV_ABBREV" ## qa, develop, prod, staging

## Remove previous version of the container
echo "Cleaning up previous '$MODULE/$BUILD_NODE_ENV' docker containers"
docker stop "$MODULE-$BUILD_NODE_ENV"
docker rm "$MODULE-$BUILD_NODE_ENV"

## Remove previous version of the image
echo "Cleaning up previous '$MODULE/$BUILD_NODE_ENV' docker images"
# docker rmi "$MODULE/$BUILD_NODE_ENV" # -f

## Build the image and tag it
echo "Building Docker image. Tagged: $MODULE/$BUILD_NODE_ENV_ABBREV"
docker build \
    --build-arg MODULE=$MODULE \
    --build-arg AWS_PROFILE=$AWS_PROFILE \
    --build-arg AWS_BUCKET_ROOT=$AWS_BUCKET_ROOT \
    --build-arg BUILD_NODE_ENV=$BUILD_NODE_ENV \
    --build-arg BUILD_NODE_ENV_ABBREV=$BUILD_NODE_ENV_ABBREV \
    -t "$MODULE/$BUILD_NODE_ENV" \
    .

# Run the image 
echo "Running Docker container $MODULE-$BUILD_NODE_ENV from image $MODULE/$BUILD_NODE_ENV"
docker run -it \
    -v ~/.aws:/root/.aws \
    -e AWS_BUCKET_ROOT=$AWS_BUCKET_ROOT \
    -e AWS_PROFILE=$AWS_PROFILE \
    -e BUILD_NODE_ENV=$BUILD_NODE_ENV \
    -e MODULE=$MODULE \
    -e BUILD_NODE_ENV_ABBREV=$BUILD_NODE_ENV_ABBREV \
    --name "$MODULE-$BUILD_NODE_ENV" "$MODULE/$BUILD_NODE_ENV"
