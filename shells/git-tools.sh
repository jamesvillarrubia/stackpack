stash() {
  # check if we have uncommited changes to stash
  # git status --porcelain | grep "^." >/dev/null;
 
  STACKPACK_REF_STASH=0
  # echo "REF_STASH ${REF_STASH}"
  if [[ -n $(git status -s) ]]
  then
    if git stash save -u "git-update on `date`";
    then
      STACKPACK_REF_STASH=1;
    fi
  fi
  export STACKPACK_REF_STASH
  echo "\nCurrent branch has been stashed to referenceId: $STACKPACK_REF_STASH\n"
}

unstash() {
  # echo "REF_STASH = ${REF_STASH}"
  # check if we have uncommited change to restore from the stash
  if [ "$STACKPACK_REF_STASH" == "1" ]
  then
    git stash apply -q;
    STACKPACK_REF_STASH=0;
    export STACKPACK_REF_STASH
  fi
  echo "\nCurrent branch has been unstashed from referenceId: $STACKPACK_REF_STASH\n"
}

"$@"
