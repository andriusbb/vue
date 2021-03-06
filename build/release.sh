set -e
echo "Enter release version: "
read VERSION

read -p "Releasing $VERSION - are you sure? (y/n)" -n 1 -r
echo    # (optional) move to a new line
if [[ $REPLY =~ ^[Yy]$ ]]
then
  echo "Releasing $VERSION ..."
  export SAUCE_BUILD_ID=$VERSION:`date +"%s"`

  npm run lint
  npm run flow
  npm run test:cover
  npm run test:e2e
  npm run test:ssr
  npm run test:sauce

  # build
  VERSION=$VERSION npm run build

  # update packages
  cd packages/blu-template-compiler
  npm version $VERSION
  npm publish
  cd -

  cd packages/blu-server-renderer
  npm version $VERSION
  npm publish
  cd -

  # commit
  git add -A
  git commit -m "[build] $VERSION"
  npm version $VERSION --message "[release] $VERSION"

  # publish
  git push origin refs/tags/v$VERSION
  git push
  npm publish
fi
