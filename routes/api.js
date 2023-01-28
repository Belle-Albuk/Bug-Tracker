module.exports = (app, userDatabase, bugDatabase) => {
    // GET method

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

    // DELETE method
}