// utility to clean mongoose _id and __v from responses and id
module.exports = function cleanMongoResponse(schema) {
    schema.set('toJSON', {
        virtuals: true,
        versionKey: false,
        transform: (_document, ret) => {
            if (ret._id){
                ret.id = ret._id.toString(); delete ret._id
            }
            return ret;
        }
    });
    schema.set('toObject', { virtuals: true, versionKey: false });
};