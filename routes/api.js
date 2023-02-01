let ObjectId = require('mongodb').ObjectId;

module.exports = (app, userDatabase, bugDatabase) => {
    // GET method
    app.route('/profile/api')
        .get(async (req, res) => {            
            const user_id = req.session.user_id;
            if (req.query.sort) {
                const order = ['urgent', 'medium', 'low'];
                const match = {$match: {user_id: user_id}};
                const set = {$set: {order: {$indexOfArray: [order, '$priority']}}};
                const sort = {$sort: {order: 1}}
                const pipeline = [match, set, sort];

                const query = bugDatabase.aggregate(pipeline);
                res.send(await query.toArray());
            } else {
            const pipeline = [
                {$match: {user_id: user_id}}
            ]
            const query = bugDatabase.aggregate(pipeline);
            res.send(await query.toArray());
            }                                    
        })

    // POST method
    app.route('/profile/api')
        .post((req, res) => {
            if (!req.body.title || !req.body.description) {
                res.json({error:'required field(s) missing'});
            } else {
                // Insert bug data
                bugDatabase.insertOne({
                    user_id: req.session.user_id,
                    created_by: req.session.username,
                    bug_title: req.body.title,
                    bug_description: req.body.description,
                    assigned_to: req.body.assigned_to,
                    priority: req.body.priority,
                    created_on: new Date().toString(),
                    updated_on: new Date().toString(),
                    open: true
                }, async (err, doc) => {
                    if (err) return console.log(err)
                    const pipeline = [
                        {$match: {_id: doc.insertedId}},
                        {$project: {user_id: 0}}
                    ];
                    const query = bugDatabase.aggregate(pipeline);
                    await query.forEach(data => res.json(data));
                })
            }

        })

    // Update bug

    // Close bug issue
    app.route('/profile/api/:id')
        .put(async (req, res) => {
            const _id = req.params.id;
            const filter = {_id: new ObjectId(_id)};
            const updatedDoc = {
                $set: {open: false}
            };
            await bugDatabase.updateOne(filter, updatedDoc, (err, doc) => {
                if (err || doc.modifiedCount === 0) {
                    res.json({error: 'could not update', '_id': _id});
                } else {
                    res.json({result: 'successfully updated', '_id': _id});
                }
            })
        })

    // DELETE method
    app.route('/profile/api/:id')
        .delete(async (req, res) => {
            const _id = req.params.id;
            const result = await bugDatabase.deleteOne({_id: new ObjectId(_id)});
            if (result.deletedCount === 1) {
                res.json({result: 'successfully deleted', '_id': _id});
            } else {
                res.json({error: 'could not delete', '_id': _id});
            }
        })
}