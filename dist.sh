PLATFORM=$(node -e 'process.stdout.write(process.platform)')
VERSION=$(node -e 'process.stdout.write(process.version)')
ARCH=$(node -e 'process.stdout.write(process.arch)')
mkdir -p ./dist/lib
#export CXXFLAGS="-O3 -Wall -Wextra"
#node-gyp --openssl_fips=1 --target=$VERSION configure
#node-gyp --openssl_fips=1 --target=$VERSION build
cp build/Release/patchr.node dist/$PLATFORM.$ARCH.node
#strip dist/$PLATFORM.$ARCH.node
cp lib/patchr.js dist/lib
cp index.js dist/
cp package.json dist/
