'use strict' 

module.exports = {

    /**
     * 
     * Get a submission in the current session
     * 
     * @param {Integer} id 
     * 
     * @return {Submission}
     */
    async findOne(ctx) {

        // get the submission id and current session
        let { id } = ctx.params
        const { session } = ctx.state.user

        // make sure the id
        // is in the proper format
        id = parseInt(id)

        // ensure the id is an int
        if (!strapi.services.validator.isInt(id)) return ctx.badRequest(
            'The submission id must be an int!',
            { id: 'Submission.find.id.invalid', error: 'ValidationError' }
        )

        // ensure the submission exists and belongs to the current session
        const submission = await strapi.services.submission.findOne({ id })
        if (!submission || !submission.session || submission.session.id != session) return ctx.notFound(
            'The submission id provided is invalid!',
            { id: 'Submission.find.id.notfound', error: 'ValidationError' }
        )

        // only return the full submission object with it is complete
        return submission.status == 'COMPLETED' ? submission : { status: submission.status } 
    },

    /**
     * 
     * Create a submission entry and add compile job to the queue
     * 
     * @param {String} board
     * @param {String} sketch
     * @param {Integer} activity
     * @param {String} workspace 
     * 
     * @return {Submission}
     */
    async create(ctx) {

        // ensure request was not sent as formdata
        if (ctx.is('multipart')) return ctx.badRequest(
            'Multipart requests are not accepted!',
            { id: 'Submission.create.format.invalid', error: 'ValidationError' }
        )

        // ensure the request has the right number of params
        const params = Object.keys(ctx.request.body).length
        if (params !== 4) return ctx.badRequest(
            'Invalid number of params!',
            { id: 'Submission.create.body.invalid', error: 'ValidationError' }
        )

        // validate the request
        const { activity: activityId, workspace, board, sketch } = ctx.request.body
        if (!strapi.services.validator.isInt(activityId) || !workspace || !board || !sketch ) return ctx.badRequest(
            'A activity, workspace, board, and sketch must be provided!',
            { id: 'Submission.create.body.invalid', error: 'ValidationError' }
        )

        // ensure the activity is valid
        const activity = await strapi.services.activity.findOne({ id: activityId })
        if (!activity) return ctx.notFound(
            'The activity provided is invalid!',
            { id: 'Submission.create.activity.invalid', error: 'ValidationError' }
        )

        // get the current session
        const { session } = ctx.state.user

        // construct submission
        return await strapi.services.submission.startJob({
            activity: activityId,
            session,
            workspace,
            board,
            sketch
        })
    },
}
