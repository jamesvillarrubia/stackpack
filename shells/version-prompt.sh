PS3='Please enter the release type: '
options=("Major" "Minor" "Patch" "Quit")
select opt in "${options[@]}"
do
    case $opt in
        "Major")
            git commit -m "semver:major" --allow-empty
            echo "Rolling out a major release."
            break
            ;;
        "Minor")
            git commit -m "semver:minor" --allow-empty
            echo "Rolling out a minor release."
            break
            ;;
        "Patch")
            git commit -m "semver:patch" --allow-empty
            echo "Rolling out a patch release."
            break
            ;;
        "Quit")
            break
            ;;
        *) echo invalid option;;
    esac
done