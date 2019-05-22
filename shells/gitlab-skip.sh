#!/usr/bin/env bash
MESSAGE=$(git log --oneline -1)
REG_MIN="semver:(feature|minor)"
REG_MAJ="semver:(release|major|breaking)"
REG_PAT="semver:(patch|fix|hotfix)"
REG_RUN="run-gitlab-ci"


if [[ ${MESSAGE} =~ ${REG_MIN} ]]; then
    echo ""
elif [[ ${MESSAGE} =~ ${REG_MAJ} ]]; then
    echo ""
elif [[ $MESSAGE =~ $REG_PAT ]]; then
    echo ""
elif [[ ${MESSAGE} =~ ${REG_RUN} ]]; then
    echo ""
else
    echo "No Versioning needed"
    curl -s -X --verbose --request POST --header "PRIVATE-TOKEN: ${CI_PERSONAL_TOKEN}" "https://gitlab.com/api/v4/projects/${CI_PROJECT_ID}/pipelines/${CI_PIPELINE_ID}/cancel"
    exit 1
fi

