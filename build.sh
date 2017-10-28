PLATFORM=$(node -e 'process.stdout.write(process.platform)')
VERSION=$(node -e 'process.stdout.write(process.version)')
ARCH=$(node -e 'process.stdout.write(process.arch)')
mkdir -p ./dist/lib
#node-gyp --openssl_fips=1 --target=$VERSION configure
#export CXXFLAGS="-O3 -Wall -Wextra"
#node-gyp --openssl_fips=1 --target=$VERSION build
npm run build
cp build/Release/patchr.node ./$PLATFORM.$ARCH.node
cp $PLATFORM.$ARCH.node dist/
rm $PLATFORM.$ARCH.node
cp lib/patchr.js dist/lib
cp index.js dist/
cp package.json dist/