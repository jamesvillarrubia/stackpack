AWS_PROFILE=$1
DEPLOY_ENV=$2



# sed ${DEPLOY_ENV}-${AWS_BUCKET_ROOT}

if [ ! -f "./deploy/cloudfrontConfig-$DEPLOY_ENV.json" ]; then 
    echo "\nNo cloudfront config file."
else 
    echo "\nInvalidating cloudfront."
    aws configure set preview.cloudfront true
    # Get the current ETag from the distro config
    CONFIG=$(cat ./deploy/cloudfrontConfig-$DEPLOY_ENV.json)
    # echo $CONFIG
    AWS_CLOUDFRONT_ID=$(echo $CONFIG | json Distribution.Id)
    # echo $AWS_CLOUDFRONT_ID
    FETCHED_CONFIG=$(aws cloudfront get-distribution --id $AWS_CLOUDFRONT_ID --profile $AWS_PROFILE)
    ETAG=$(echo $FETCHED_CONFIG | json ETag)
    # echo $ETAG
    aws cloudfront create-invalidation --distribution-id $AWS_CLOUDFRONT_ID --paths '/*' --profile $AWS_PROFILE --debug
fi