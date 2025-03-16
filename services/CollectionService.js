const { ObjectId } = require("mongodb")
const database  = require("../config/db.config")
const collections = database.collection('collections');

const users = database.collection('users');

const CollectionService = {
    collect:async ({projectId,userId,favorite}) => {
        //对用户信息中该 收藏夹的长度 +1
        return collections.insertOne({
            projectId: new ObjectId(projectId),
            userId: new ObjectId(userId),
            favorite,
        })
    },
    unCollect:async ({_id, _ids, projectId, userId, favorite})=>{
        //根据单个ID进行单个删除
        // console.log(_id, _ids, projectId, userId, favorite)
        if(_id){
            return collections.deleteOne({
                _id: new ObjectId(_id),
            })
        }
        //根据多个ID进行单个删除
        if(_ids){
            _ids = _ids.map((_id) => new ObjectId(_id));
            return collections.deleteMany({
                _id: { $in: _ids } // 删除 age 字段值在 [25, 35] 中的文档
            })
        }

        if(projectId && favorite){
            console.log("ping")
            console.log(projectId,favorite,userId)
            //根据 项目名,收藏夹，用户 进行单个删除 —— view界面取消收藏某个界面
            return collections.deleteOne({
                projectId: new ObjectId(projectId),
                favorite,
                userId: new ObjectId(userId) 
            })
        }
        if(projectId && !favorite){
            //根据 项目名 进行多个删除 —— 删除项目，取消所有与该项目相关的收藏
            return collections.deleteMany({
                projectId: new ObjectId(projectId),
            })
        }
        if(!projectId && favorite){
            //根据 用户和收藏夹名称 进行多个删除 —— 删除收藏夹
            return collections.deleteMany({
                favorite,
                userId: new ObjectId(userId)  
            })
        }
        console.log("pong")
    },
    // unCollect_ids:async ({_ids})=>{
        // if(favorite == 'all'){
            // console.log('df')
            // return collections.deleteMany({
            //     projectId: new ObjectId(projectId),
            //     userId: new ObjectId(userId)
            // })
        // }else{
    //         console.log(_id,projectId,userId,favorite)
    //         return collections.deleteOne({
    //             _id: new ObjectId(_id),
    //         })
    //     }
    // },

    //某个项目相关的所有收藏夹  ,projectId,userId,favorite
    //unCollect_project
    // deleteAllCollections:async ({projectId})=>{
    //     return collections.deleteMany({
    //         projectId: new ObjectId(projectId),
    //     })
    // },
    //删除某个用户该收藏夹下所有的收藏夹
    //unCollect_favorite
    findCollections:async ({projectId ,userId}) => {
        // const options = {
        //     projection:{_id:1,projectId:1,favorite:1}
        // }
        let pipeline 
        if(projectId){
            projectId = new ObjectId(projectId)
            pipeline = [{
                $match:{ userId:new ObjectId(userId), projectId }
            },{
               $lookup:{
                    from: "projects",
                    localField: "projectId",
                    foreignField: "_id",
                    as: "project_mapping"
               },
            },{
                $set: {
                    project_mapping: { $first: "$project_mapping" },
                },
            },
            {
                $set: {
                    // projectId: "$project_mapping._id",
                    name: "$project_mapping.name",
                    coverImg: "$project_mapping.coverImg",
                    tags: "$project_mapping.tags",
                    permission: "$project_mapping.permission",
                },
            },{
                $unset: ["userId","project_mapping"]
            }]
        }else{
            pipeline = [{
                $match:{ userId:new ObjectId(userId) }
            },{
               $lookup:{
                    from: "projects",
                    localField: "projectId",
                    foreignField: "_id",
                    as: "project_mapping"
               },
            },{
                $set: {
                    project_mapping: { $first: "$project_mapping" },
                },
            },
            {
                $set: {
                    // projectId: "$project_mapping._id",
                    name: "$project_mapping.name",
                    coverImg: "$project_mapping.coverImg",
                    tags: "$project_mapping.tags",
                    permission: "$project_mapping.permission",
                },
            },{
                $unset: ["userId","project_mapping"]
            }]
        }

        let cc = await collections.aggregate(pipeline)
        return cc.toArray()
    },
    findCollections2:async ({projectId}) => {
        const cursor = collections.find({projectId})
        return cursor.toArray()
    },
    getProIsCollected:async ({userId,projectId}) => {
        const cursor = collections.find({
            projectId: new ObjectId(projectId),
            userId: new ObjectId(userId),
        })
        return cursor.toArray()
    },
    //统计有多少用户收藏了某个项目
    getCollectionCount:async ({projectId}) => {
        // let pipeline = [{
        //     $match: { projectId: new ObjectId(projectId) }
        // },{
        //     $group: { _id: "$userId", count: { $sum: 1 } }
        // },{
        //     $project: { _id: 0, count: 1 }
        // },
        // {
        //     $group: { _id: null, totalCount: { $sum: '$count' } }
        // }]
        let pipeline = [{
            $match: { projectId: new ObjectId(projectId) }
        },{
            $group: { _id: "$userId"}
        },{
            $group: { _id: null, userCount: { $sum: 1 } }
        }]
        let result = await collections.aggregate(pipeline).toArray()
        if(result.length == 0){
            return 0
        }else{
            return result[0].userCount 
        }
    },
    updateCollections:async ({_id,favoriteName,reName}) =>{
        return collections.updateMany(
            {userId:_id,favorite: favoriteName},
            {$set:{favorite:reName}},
        )
    },
}

module.exports = CollectionService