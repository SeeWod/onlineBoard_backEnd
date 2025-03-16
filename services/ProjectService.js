const { ObjectId } = require("mongodb")
const database  = require("../config/db.config")
const projects = database.collection('projects');
const collections = database.collection('collections');

const ProjectService = {
    // upload:async({_id,projectname,introduction,gender,avatar}) => {
    //     if(avatar){
    //         return projects.updateOne({
    //             _id
    //         },{
    //             projectname,introduction,gender,avatar
    //         })
    //     }else{
    //         return projects.updateOne({
    //             _id
    //         },{
    //             projectname,introduction,gender
    //         })
    //     }
    // },
    add:async (project) => {
        return projects.insertOne(project)
    },
    del:async ({_id})=>{
        return projects.deleteOne({_id: new ObjectId(_id)})
    },
    findOne:async ({_id})=>{
        return projects.findOne({_id: new ObjectId(_id)})
    },
    updateInfo:async (_id, projectInfo) =>{
        return projects.updateOne(
            {_id: new ObjectId(_id)},
            {$set: projectInfo},
        )
    },
    updateData:async (_id, updateData) =>{
        return projects.updateOne(
            {_id: new ObjectId(_id)},
            {$set: updateData},
        )
    },
    findInvolved:async ({userId})=>{
        const filter = {participator: {$all:[userId]}}
        //新增创建时间，按创建时间查询（不需要新增，id默认记录时间序列了 按id排序）
        const options = {
            sort: {createAt: -1},
            projection:{_id:1,name:1,tags:1,permission:1,coverImg:1,lastModified:1,createAt:1},
        }
        const cursor = projects.find(filter,options)
        return cursor.toArray()
    },
    find_allPublics:async ({userId})=>{
        // const filter = {permission: {$regex: /public/}}
        // 新增创建时间，按创建时间查询（不需要新增，id默认记录时间序列了 按id排序）
        // const options = {
        //     sort: {createAt: -1},
        //     projection:{_id:1,name:1,tags:1,permission:1}
        // }
        // const cursor = projects.find(filter,options)
        // let list = cursor.toArray()
        
        // console.log(userId)

        let pipeline = [{
            $match:{ permission: {$regex: /public/} }
        },{
           $lookup:{
                from: "collections",
                localField: "_id",
                foreignField: "projectId",
                as: "collection_mapping"
           },
        },{
            $addFields:{
              filteredField: {  
                $filter: {  
                  input: "$collection_mapping", // 输入是$lookup生成的数组  
                  as: "item", // 为数组中的每个元素指定一个别名  
                  cond: {  
                    $eq: [ "$$item.userId", new ObjectId(userId)]
                  }  
                }  
              }  
            }  
        },{
            $set:{
                isCollected: {  
                    $cond: [  
                        { $ne: [{ $size: "$filteredField" }, 0] }, // 检查 filteredField.length 是否不等于 0  
                        true, // 如果条件为真，则设置为 true  
                        false // 如果条件为假，则设置为 false  
                    ]  
                }  
            }
        },{
            $unset: ["filteredField","collection_mapping"]
        }
    ]

        let cc = await projects.aggregate(pipeline)
        // let aa = collections.find({})
        // let x = await aa.toArray()
        // console.log(x)
        // console.log(await cc.toArray())
        return cc.toArray()
    }
    // find_publics:async (lengthNow,lengthLimit)=>{
    //     const filter = {access:'public'}
    //     //新增创建时间，按创建时间查询（不需要新增，id默认记录时间序列了 按id排序）
    //     const options = {
    //         sort: {lastModified: -1},
    //         skip: 
    //         projection:{_id:1,name:1,tag:1}
    //     }
    //     //查询总数

    //     lengthMax = await ProjectService.count(filter)
    //     //查询规则选项
    //     const cursor = projects.find(filter,options)
    // }


}
module.exports = ProjectService