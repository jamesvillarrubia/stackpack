AWS_ENV=$1

if [ $AWS_ENV == 'production' ]; then
    AWS_ENV='prod'
fi

## Remove robots if it exists, and recreate it empty
rm build/robots.txt 2> /dev/null
touch build/robots.txt

if [ $AWS_ENV == 'prod' ]; then
    printf 'User-agent: *\nAllow: /' > build/robots.txt;
else
    prAWS_ENV=$1

if [ $AWS_ENV == 'production' ]; then
    AWS_ENV='prod'
fi

## Remove robots if it exists, and recreate it empty
rm build/robots.txt 2> /dev/null
touch build/robots.txt

if [ $AWS_ENV == 'prod' ]; then
    printf 'User-agent: *\nAllow: /' > build/robots.txt;
else
    printf 'User-agent: *\nDisallow: /' > build/robots.txt;
fi
intf 'User-agent: *\nDisallow: /' > build/robots.txt;
fi
