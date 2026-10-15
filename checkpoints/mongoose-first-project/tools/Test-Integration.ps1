param(
    [Parameter(Mandatory = $true)]
    [string]$MongoUri
)

# Scope the test URI to this process and restore any previous value afterward.
$previousTestMongoUri = $env:TEST_MONGO_URI
try {
    $env:TEST_MONGO_URI = $MongoUri
    npm test
    $testExitCode = $LASTEXITCODE
} finally {
    $env:TEST_MONGO_URI = $previousTestMongoUri
}
exit $testExitCode
