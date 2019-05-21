AWS_PROFILE=$1
AWS_BUCKET_ROOT=$2
BUILD_NODE_ENV_ABBREV=$3

if [ BUILD_NODE_ENV_ABBREV == 'production' ]; then
    BUILD_NODE_ENV_ABBREV='prod'
fi

## Get a list of buckets with this name
echo "Checking for AWS bucket s3://${BUILD_NODE_ENV_ABBREV}-${AWS_BUCKET_ROOT}"
S3_CHECK=$(aws s3 ls "s3://${BUILD_NODE_ENV_ABBREV}-${AWS_BUCKET_ROOT}" --profile ${AWS_PROFILE} 2>&1)

## If the check did not exit successfully
if [ $? != 0 ]; then
    ## If it didn't find the bucket
    NO_BUCKET_CHECK=$(echo $S3_CHECK | grep -c 'NoSuchBucket') 
    if [ $NO_BUCKET_CHECK = 1 ]; then
        ## Bucket does not exist - lets create it
        echo "Bucket does not exist"
        aws s3api create-bucket --bucket "${BUILD_NODE_ENV_ABBREV}-${AWS_BUCKET_ROOT}" --profile $AWS_PROFILE
    ## Else it returned a different error
    else
        echo "Error checking S3 Bucket"
        echo "$S3_CHECK"
        exit 1
    fi 
## Else it found the bucket
else
    echo "Bucket exists"
fi

## Configure the bucket's access and policy
aws s3api put-bucket-acl --profile ${AWS_PROFILE} --bucket "${BUILD_NODE_ENV_ABBREV}-${AWS_BUCKET_ROOT}" --acl public-read
POLICY=$(cat ./deploy/public_permissions.json) && \
NEW_POLICY=${POLICY/bucket/"${BUILD_NODE_ENV_ABBREV}-${AWS_BUCKET_ROOT}"} && \
aws s3api put-bucket-policy --bucket "${BUILD_NODE_ENV_ABBREV}-${AWS_BUCKET_ROOT}" --policy "${NEW_POLICY}" --profile $AWS_PROFILE

## Configure the bucket as a website
aws s3 website "s3://${BUILD_NODE_ENV_ABBREV}-${AWS_BUCKET_ROOT}" --index-document index.html --error-document index.html --profile $AWS_PROFILE

## Wipe the cotents of the bucket
aws s3 rm "s3://${BUILD_NODE_ENV_ABBREV}-${AWS_BUCKET_ROOT}" --recursive --profile $AWS_PROFILE

## Upload the contents of the build folder
aws s3 sync build/ "s3://${BUILD_NODE_ENV_ABBREV}-${AWS_BUCKET_ROOT}" --profile $AWS_PROFILE
