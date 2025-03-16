const CollectionService = require("../services/CollectionService");
const UserService = require("../services/UserService");
const JWT = require("../util/JWT")

const CollectionController = {
    collect:async (req, res) => {
        let {projectId,favorites} = req.body
        const token = req.headers["authorization"].split(" ")[1]
        var payload = JWT.verify(token)
        // try {
            for(let favorite of favorites){
                let result = await CollectionService.collect({projectId,userId:payload._id,favorite})
                let result2 = await UserService.updateFavoriteAmount({_id:payload._id, favoriteName: favorite, num: +1})               
            }
            res.send({
                code:"SUCCESS_COLLECT-PROJECT",
                msg: "收藏成功",
            })
        // } catch(e){
        //   res.send({
        //     code:"ERROR_COLLECT-ROJECT",
        //     msg: "收藏失败",
        //   })
        // }
    },
    unCollect:async (req, res)=>{
        let {_id, _ids, projectId,favorite} = req.body

        const token = req.headers["authorization"].split(" ")[1]
        let payload = JWT.verify(token)
        let userId = payload._id
        // try {
        // if()
        //     let result = await CollectionService.unCollect({_id, _ids, projectId,userId:payload._id,favorite,favorites})
        //     res.send({
        //         code:"SUCCESS_UNCOLLECT-PROJECT",
        //         msg: "取消收藏成功",
        //     })
        //根据单个ID进行单个删除————用于收藏页面，单个项目弹框的取消收藏功能
        if(_id && favorite){
            let result = await CollectionService.unCollect({_id})
            let result2 = await UserService.updateFavoriteAmount({_id:userId, favoriteName: favorite, num: -1})
            res.send({
                code:"SUCCESS_UNCOLLECT-PROJECT",
                msg: "取消收藏成功",
            })
        }else if(_ids){
            //根据多个ID进行单个删除————用于收藏页面，单个项目弹框的取消收藏功能
            let result = await CollectionService.unCollect({_ids})
            let result2 = await UserService.updateFavoriteAmount({_id:userId, favoriteName: favorite, num: (-_ids.length)})
            res.send({
                code:"SUCCESS_UNCOLLECT-PROJECT",
                msg: "取消收藏成功",
            })
        }else if(projectId && favorite){
            //根据 项目名,收藏夹，用户 进行单个删除 —— view界面取消收藏某个界面
            let result = await CollectionService.unCollect({projectId,favorite,userId})
            let result2 = await UserService.updateFavoriteAmount({_id:userId, favoriteName: favorite, num: (-1)})
            res.send({
                code:"SUCCESS_UNCOLLECT-PROJECT",
                msg: "取消收藏成功",
            })
        }else if(projectId && !favorite){
            let result0 = await CollectionService.findCollections2({projectId})
            //根据 项目名 进行多个删除 —— 删除项目，取消所有与该项目相关的收藏
            let result = await CollectionService.unCollect({projectId})
            //查找所有收藏夹，然后逐一修改amount
            console.log(result0)
            for(let collection of result0){
                let result2 = await UserService.updateFavoriteAmount({_id:collection.userId, favoriteName: collection.favorite, num: (-1)})
            }
            res.send({
                code:"SUCCESS_UNCOLLECT-PROJECT",
                msg: "取消收藏成功",
            })
        }else if(!projectId && favorite){
            //根据 用户和收藏夹名称 进行多个删除 —— 删除收藏夹
            let result = await CollectionService.unCollect({favorite, userId})
            //该收藏夹直接删除，不需要变更amount
            res.send({
                code:"SUCCESS_UNCOLLECT-PROJECT",
                msg: "取消收藏成功",
            })
        }
        // } catch(e){
        //   res.send({
        //     code:"ERROR_COLLECT-ROJECT",
        //     msg: "收藏失败",
        //   })
        // }
    },
    unCollect_P_favorites:async (req, res)=>{
        let {projectId,favorites} = req.body
        console.log(projectId,favorites)
        const token = req.headers["authorization"].split(" ")[1]
        var payload = JWT.verify(token)
        // try {
            for(let favorite of favorites){
                let result = await CollectionService.unCollect({projectId, userId:payload._id, favorite})
            }
            res.send({
                code:"SUCCESS_UNCOLLECT-PROJECT",
                msg: "取消收藏成功",
            })
        // } catch(e){
        //   res.send({
        //     code:"ERROR_COLLECT-ROJECT",
        //     msg: "收藏失败",
        //   })
        // }
    },
    getCollections:async (req, res) => {
        let { projectId } = req.query

        const token = req.headers["authorization"].split(" ")[1]
        var payload = JWT.verify(token)
        console.log("dd"+projectId)
        // try {
            let result = await CollectionService.findCollections({ projectId ,userId:payload._id })
            console.log(result)
            //遍历 获取所有项目数据  ----------可以用复合查询码 将
            //collections里要有所有项目信息 name，。。
            res.send({
                code:"SUCCESS_COLLECTIONS-GET",
                msg: "获取收藏数据成功",
                data: result
            })
        // } catch(e){
        //   res.send({
        //     code:"ERROR_COLLECT-ROJECT",
        //     msg: "收藏失败",
        //   })
        // }
    },
    getProIsCollected:async (req, res) => {
        let { projectId } = req.query
        const token = req.headers["authorization"].split(" ")[1]
        var payload = JWT.verify(token)

        // try {
            let result = await CollectionService.getProIsCollected({ userId:payload._id,projectId })
            res.send({
                code:"SUCCESS_COLLECTIONS-GET",
                msg: "获取收藏数据成功",
                data: result.length != 0?'true':'false'
            })
        // } catch(e){
        //   res.send({
        //     code:"ERROR_COLLECT-ROJECT",
        //     msg: "收藏失败",
        //   })
        // }
    },
    getCollectionCount:async (req, res) => {
        let { projectId } = req.query

        // try {
            let result = await CollectionService.getCollectionCount({ projectId })
            res.send({
                code:"SUCCESS_COLLECTIONS-GET",
                msg: "获取收藏数据成功",
                data: result
            })
        // } catch(e){
        //   res.send({
        //     code:"ERROR_COLLECT-ROJECT",
        //     msg: "收藏失败",
        //   })
        // }
    }
}
module.exports = CollectionController