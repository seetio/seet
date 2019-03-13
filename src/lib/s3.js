const AWS       = require('aws-sdk');
const env       = process.env;

AWS.config.update({
    accessKeyId     : env.S3_ACCESS_KEY_ID,
    secretAccessKey : env.S3_SECRET_ACCESS_KEY,
    "region"        : env.S3_REGION
});

const s3 = new AWS.S3({
    params: {
        Bucket: env.S3_BUCKET
    }
});

exports.UploadFile = function (FileName, FileBuffer, ContentType) {
    return new Promise (
        (Resolve, Reject) => {
            s3.upload({
                Key: FileName,
                Body: FileBuffer,
                ContentType: ContentType,
                ACL: 'public-read'

            }, function (err, data) {
                if (err) {
                    return Reject(err);
                }

                Resolve(endpoint + FileName);
            });
        }
    );
};

exports.DeleteFile = function (FileName) {
    return new Promise (
        (Resolve, Reject) => {
            s3.deleteObject({
                Key: FileName,
            }, function (err, data) {
                if (err) {
                    return Reject(err);
                }
                Resolve(true);
            });
        }
    );
};

exports.DeleteFiles = function (KeysArray) {
    return new Promise (
        (Resolve, Reject) => {
            s3.deleteObjects({
                Delete: {
                    Objects: KeysArray
                }
            },
                function (err, data) {
                    if (err) {
                        return Reject(err);
                    }
                    Resolve(true);
            });
        }
    );
};

exports.UploadStream = function (FileName, readableStream, customName) {
    let params = {
        Key: FileName,
        ACL: 'public-read',
        Body: readableStream,
        ContentLength: readableStream.byteCount,
    };

    if (customName) {
        params.ContentDisposition = 'attachment; filename=' + encodeURIComponent(customName);
    }

    return new Promise (
        (Resolve, Reject) => {
            s3.putObject(params, function(err, data) {
                if (err) {
                    return Reject(err);
                }

                Resolve(endpoint + FileName);
          });
        }
    )
};

const gg = exports.GetDirectorySize = async function (DirectoryID) {
    let totalCount = 0;

    function getFilesAndCalculate (lastKey) {
        let params = {
        };

        if (DirectoryID) {
            params.Prefix = DirectoryID;
        }

        if (lastKey) {
            params.Marker = lastKey;
        }

        return new Promise (
            (Resolve, Reject) => {
                s3.listObjects(params, function(err, data) {
                    if (err) {
                        return Reject(err)
                    }

                    Resolve(data);
                });
            }
        ).then(
            (data) => {
                for (let item of data.Contents) {
                    totalCount += item.Size;
                }

                if (true === data.IsTruncated) {
                    let lastArrayKey = data.Contents[data.Contents.length - 1].Key;
                    return getFilesAndCalculate(lastArrayKey);
                }

                return totalCount / 1000 / 1000; // in MB
            }
        )
    }

    return getFilesAndCalculate();
};

const endpoint = exports.endpoint  = env.S3_ENDPOINT || `https://s3.${env.S3_REGION}.amazonaws.com${env.S3_BUCKET}`;
