#!/usr/bin/env bash
MESSAGE=$(git log --oneline -1)
REG_MIN="semver:(feature|minor)"
REG_MAJ="semver:(release|major|breaking)"
REG_PAT="semver:(patch|fix|hotfix)"
REG_GF_MAJ="Merge branch 'release"
REG_GF_MIN="Merge branch 'feature"
REG_GF_PAT="Merge branch 'hotfix"

git describe --tags --match "*[0-9]*[.][0-9]*[.][0-9]*"
git describe --tags --match "*[0-9]*[.][0-9]*[.][0-9]*" --abbrev=0

echo '******'

git tag -l 

echo '******'

git tag -l "*[0-9]*[.][0-9]*[.][0-9]*"


git describe --tags --match "*[0-9]*[.][0-9]*[.][0-9]*" --abbrev=0

if [[ ${MESSAGE} =~ ${REG_MIN} ]] || [[ ${MESSAGE} =~ ${REG_GF_MIN} ]]; then

    VERSION_TAG=$(git describe --tags --match "*[0-9]*[.][0-9]*[.][0-9]*" --abbrev=0)
    echo "VERSION_TAG: $VERSION_TAG"

    if [[ -z $VERSION_TAG ]]; then 
        echo "No prior version tag.  Try adding 0.0.1 to an earlier commit."
        exit 1
    fi
    VERSION=$(semver $VERSION_TAG)
    echo "VERSION: $VERSION"
    NEW_VERSION=$(semver -i "minor" $VERSION )
    echo "NEW_VERSION: $NEW_VERSION"
    git tag --points-at HEAD | grep "*[0-9]*[.][0-9]*[.][0-9]*" | xargs -n 1 -I% curl -s -X --verbose --request DELETE --header "PRIVATE-TOKEN: ${CI_PERSONAL_TOKEN}" "https://gitlab.com/api/v4/projects/${CI_PROJECT_ID}/repository/tags/%"
    #git tag -a "v$NEW_VERSION" -m "Minor Version Update"
    curl -s -X --verbose --request POST --header "PRIVATE-TOKEN: ${CI_PERSONAL_TOKEN}" "https://gitlab.com/api/v4/projects/${CI_PROJECT_ID}/repository/tags?tag_name=${NEW_VERSION}&ref=${CI_COMMIT_SHA}"
    #git push origin --tags --verbose
    #curl -s -X --verbose --request POST --header "PRIVATE-TOKEN: ${CI_PERSONAL_TOKEN}" "https://gitlab.com/api/v4/projects/${CI_PROJECT_ID}/repository/tags"

elif [[ ${MESSAGE} =~ ${REG_MAJ} ]] || [[ ${MESSAGE} =~ ${REG_GF_MAJ} ]]; then

    VERSION_TAG=$(git describe --tags --match "*[0-9]*[.][0-9]*[.][0-9]*" --abbrev=0)
    echo "VERSION_TAG: $VERSION_TAG"

    if [[ -z $VERSION_TAG ]]; then 
        echo "No prior version tag.  Try adding 0.0.1 to an earlier commit."
        exit 1
    fi
    VERSION=$(semver $VERSION_TAG)
    echo "VERSION: $VERSION"
    NEW_VERSION=$(semver -i "major" $VERSION )
    echo "NEW_VERSION: $NEW_VERSION"
    # git tag --points-at HEAD | grep "[0-9]\{1,\}.[0-9]\{1,\}.[0-9]\{1,\}" | xargs -n 1 -I% git tag -d %
    # git tag -a "v$NEW_VERSION" -m "Minor Version Update"
    # git push origin --tags --verbose
    git tag --points-at HEAD | grep "*[0-9]*[.][0-9]*[.][0-9]*" | xargs -n 1 -I% curl -s -X --verbose --request DELETE --header "PRIVATE-TOKEN: ${CI_PERSONAL_TOKEN}" "https://gitlab.com/api/v4/projects/${CI_PROJECT_ID}/repository/tags/%"
    #git tag -a "v$NEW_VERSION" -m "Minor Version Update"
    curl -s -X --verbose --request POST --header "PRIVATE-TOKEN: ${CI_PERSONAL_TOKEN}" "https://gitlab.com/api/v4/projects/${CI_PROJECT_ID}/repository/tags?tag_name=${NEW_VERSION}&ref=${CI_COMMIT_SHA}"
    
elif [[ $MESSAGE =~ $REG_PAT ]] || [[ $MESSAGE =~ $REG_GF_PAT ]]; then

    VERSION_TAG=$(git describe --tags --match "*[0-9]*[.][0-9]*[.][0-9]*" --abbrev=0)
    echo "VERSION_TAG: $VERSION_TAG"
    if [[ -z $VERSION_TAG ]]; then 
        echo "No prior version tag.  Try adding 0.0.1 to an earlier commit."
        exit 1
    fi
    VERSION=$(semver $VERSION_TAG)
    echo "VERSION: $VERSION"
    NEW_VERSION=$(semver -i "patch" $VERSION )
    echo "NEW_VERSION: $NEW_VERSION"
    # git tag --points-at HEAD | grep "[0-9]\{1,\}.[0-9]\{1,\}.[0-9]\{1,\}" | xargs -n 1 -I% git tag -d %
    # git tag -a "v$NEW_VERSION" -m "Minor Version Update"
    # git push origin --tags --verbose
    git tag --points-at HEAD | grep "*[0-9]*[.][0-9]*[.][0-9]*" | xargs -n 1 -I% curl -s -X --verbose --request DELETE --header "PRIVATE-TOKEN: ${CI_PERSONAL_TOKEN}" "https://gitlab.com/api/v4/projects/${CI_PROJECT_ID}/repository/tags/%"
    #git tag -a "v$NEW_VERSION" -m "Minor Version Update"
    curl -s -X --verbose --request POST --header "PRIVATE-TOKEN: ${CI_PERSONAL_TOKEN}" "https://gitlab.com/api/v4/projects/${CI_PROJECT_ID}/repository/tags?tag_name=${NEW_VERSION}&ref=${CI_COMMIT_SHA}"
    
fi