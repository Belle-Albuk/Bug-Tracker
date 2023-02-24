let ObjectId = require('mongodb').ObjectId;

module.exports = (app, userDatabase, bugDatabase) => {
    // GET method
    app.route('/profile/api')
        .get(async (req, res) => {      
            const user_id = req.session.user_id;
            const sortQuery = req.query.sort;
            const searchQuery = req.query.search;
            const regex = /(open|close)/i;
            if (searchQuery || sortQuery) {
                const pipeline = [{$match: {user_id: user_id}}];
                if (searchQuery) {
                    const query = {$match: 
                        {$or: [
                            {created_by: {$regex: searchQuery, $options: 'i'}},
                            {bug_title: {$regex: searchQuery, $options: 'i'}},
                            {bug_description: {$regex: searchQuery, $options: 'i'}},
                            {assigned_to: {$regex: searchQuery, $options: 'i'}},
                            {priority: {$regex: searchQuery, $options: 'i'}},
                            {open: {$eq: !regex.test(searchQuery) ? undefined : (/open/i.test(searchQuery) ? true : false)}}
                        ]}
                        
                    };
                    
                    pipeline.push(query);                    
                }
                    let sort = {};
                    const openOrder = [true, false];
                    const setOrder = {$set: {openOrder: {$indexOfArray: [openOrder, '$open']}}};
                    pipeline.push(setOrder);                    

                    switch (sortQuery) {
                        case 'priority':                            
                            const order = ['urgent', 'medium', 'low', '', null, undefined];
                            const set = {$set: {order: {$indexOfArray: [order, '$priority']}}};
                            sort = {$sort: {openOrder: 1, order: 1}};
                            pipeline.push(set);
                            break;
                        case 'recent':
                            sort = {$sort: {created_on: -1}};                            
                            break;
                        case 'oldest':
                            sort = {$sort: {created_on: 1}};
                            break;
                        case 'update':
                            sort = {$sort: {updated_on: -1}};
                            break;
                        default:
                            sort = {$sort: {openOrder: 1, created_on: -1}};                   
                    }
                    pipeline.push(sort);                

                    const query = bugDatabase.aggregate(pipeline);
                    res.send(await query.toArray());
            
            } else {
            const pipeline = [
                {$match: {user_id: user_id}},
                {$sort: {created_on: -1}}
            ]
            const query = bugDatabase.aggregate(pipeline);            
            res.send(await query.toArray());
            }                                    
        })

    // POST method
    app.route('/profile/api')
        .post((req, res) => {          
                // Insert bug data
                bugDatabase.insertOne({
                    user_id: req.session.user_id,
                    created_by: req.session.username,
                    bug_title: req.body.title,
                    bug_description: req.body.description,
                    assigned_to: req.body.assigned_to,
                    priority: req.body.priority,
                    created_on: new Date(),
                    updated_on: new Date(),
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
        })

    // Find one bug issue
    app.route('/profile/api/user')
        .get(async (req, res) => {
            const _id = req.session.user_id;
            const projection = {
                $or : [
                    {username: 1},
                    {name: 1}
                ]
            }
            res.send(await userDatabase.findOne({_id: new ObjectId(_id)}, projection));
        })

    // Update bug issue
    app.route('/profile/api/:id')
        .put(async (req, res) => {
            const _id = req.params.id;
            const change = req.body;
            const filter = {_id: new ObjectId(_id)};
            const updatedDoc = {
                $set: {
                    bug_title: change.title,
                    bug_description: change.description,
                    priority: change.priority,
                    assigned_to: change.assigned_to,
                    updated_on: new Date(),
                    open: change.close ? false : true              
                }
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