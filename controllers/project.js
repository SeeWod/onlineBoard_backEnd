const ProjectService = require("../services/ProjectService");
const CollectionService = require("../services/CollectionService");
const crypto = require("crypto");
const fs=require('fs/promises');
const JWT = require("../util/JWT")
/*数据表：
projects ——————  name tags[keywords] permission (participator) storage desc createAt data
1.不要datalist 因为服务器太差 - 后续再仿照github进行改动
项目类型：(w 与 r) 目前只有这五种
personal & public
personal & private
multi & public (有participator)
multi & private (有participator)
communal (有participator)

公开的必定是云存储
*/

//截图保存 还没做
const ProjectController = {
  add:async (req, res) => {
    let data = req.body

    let now = new Date().toString()
    // toLocaleString('en-GB', { timeZone: 'UTC' });

    let projectInfo = {
      name: data.name,
      tags: data.tags,
      permission: `${data.projectType} & ${data.isPublic}`, //覆盖
      participator: data.participator,
      desc: data.desc,
      coverImg: '/coverImg_uploads/defaultCoverImg.jpg',
      coverImgType: 'snapshoot', //snapshoot 与 customImg
      createAt: now,
      lastModified: now, //更新的时候不要
    }
    let projectData = data.data

    const hash = crypto.createHash('md5')
    hash.update(JSON.stringify(projectData))
    let dataHash = hash.digest('hex')

    //lastModified -- 哈希ID更好 ---- 还是不要了 文件的唯一性很重要 ？？？
    // let dataList = [{lastModified: now,data: dataHash}] //废弃

    // try {
      let result = await ProjectService.add({...projectInfo, data:dataHash})
      await fs.writeFile(`public/projects/${dataHash}`,JSON.stringify(projectData))
      res.send({
        code:"SUCCESS_CREATE-PROJECT",
        msg: "项目创建成功",
        data:{ projectId: result.insertedId }
      })
    // } catch(e){
    //   res.send({
    //     code:"ERROR_CREATEPROJECT",
    //     msg: "创建失败 \n "+e,
    //   })
    // }
  },
  updateInfo:async (req, res)=>{
    let {_id, name, tags, projectType, isPublic, participator, desc} = req.body

    let projectInfo = {
      name: name,
      tags: tags,
      permission: `${projectType} & ${isPublic}`, //覆盖
      participator: participator,
      desc: desc,
    }
    console.log(projectInfo)
    // try {
      await ProjectService.updateInfo(_id, projectInfo)

      res.send({
        code:"SUCCESS_PROJECT-UPDATEINFO",
        msg: "项目信息更新成功",
      })
    // } catch(e){
    //   res.send({
    //     code:"ERROR_UPDATE-PROJECT-INFO",
    //     msg: "项目信息更新失败",
    //   })
    // }
  },
  updateData:async (req, res)=>{
    //现在没有删除 oldData 文件 --- 后续
    let {_id, data:newData} = req.body

    let oldData = await ProjectService.findOne({_id})

    //判断是否更新
    const hash = crypto.createHash('md5')
    hash.update(JSON.stringify(newData))
    let newData_hash = hash.digest('hex')

    if(oldData.data != newData_hash){
      if(oldData.data != '9890a739f0d039b5d3a43414dd577641'){
        await fs.unlink(`public/projects/${oldData.data}`)
      }
      //数据更新了
      let now = new Date().toString();
      // try {
        await ProjectService.updateData(_id, {lastModified: now, data: newData_hash})
        await fs.writeFile(`public/projects/${newData_hash}`, JSON.stringify(newData))
        //删除oldData

        res.send({
          code:"SUCCESS_UPDATE-DATA",
          msg: "项目数据更新成功",
        })
    }else{
      //数据未更新
      res.send({
        code:"FAILED_UPDATE-DATA_NO-CHANGE",
        msg: "项目数据更新失败，数据未更改",
      })
    }
  },
  uploadCoverImg:async (req, res)=>{
    let {_id, coverImgType} = req.body

    let coverImg = req.file?`/coverImg_uploads/${req.file.filename}`:""

    console.log(coverImgType, coverImg)
    const result = await ProjectService.updateInfo(_id, {
      coverImgType,
      coverImg,
    })
    console.log(result)
    //更新token
    res.send({
      code:"SUCCESS_MODIFY",
      msg: "项目同步成功",
      data: {coverImg, coverImgType}
    })
  },
  getPublics:async (req, res)=>{
    // let lengthLimit = 100
    // let lengthMax = 0
    // let lengthNow = req.now
    //查询后续几个
    const token = req.headers["authorization"].split(" ")[1]
    var payload = JWT.verify(token)
    const list = await ProjectService.find_allPublics({userId:payload._id})
    // lengthMax = result.count
    // lengthNow = result.list.length
    res.send({
      code:"SUCCESS_GET-PUBLIC-PROJECTS",
      msg: "获取公开项目成功",
      data: list
      // {
      //   lengthMax:10,
      //   lengthNow: lengthNow + lengthLimit,
      //   nextProjects: result,
      // }
    })
  },
  //获取参与项目的数据（个人，团队，communal）
  getInvolved:async (req, res)=>{
    const token = req.headers["authorization"].split(" ")[1]
    var payload = JWT.verify(token)

    const list = await ProjectService.findInvolved({userId: payload._id})
    list.forEach((item) => {
      let permission = item.permission.split(" & ")
      delete item.permission
      item.projectType = permission[0]
      item.isPublic = permission[1]
    });
    res.send({
      code:"SUCCESS_GETPROJECTLIST",
      msg: "获取列表成功",
      data: list
    })
  },
  //获取某个项目的数据
  getOne:async (req, res)=>{
    let { _id } = req.query
    let result = await ProjectService.findOne({_id})
    if(result){
      let dataHash = result.data
      let permission = result.permission.split(" & ")
      // try {
        let data = await fs.readFile(`public/projects/${dataHash}`, { encoding: 'utf8' });
        res.send({
          code:"SUCCESS_GETPROJECT",
          msg: "获取项目成功",
          data: {
              name: result.name,
              tags: result.tags,
              projectType: permission[0], //覆盖
              isPublic: permission[1],
              participator: result.participator,
              desc: result.desc,
              coverImg: result.coverImg,
              coverImgType: result.coverImgType,
              createAt: result.createAt,
              lastModified: result.lastModified, //更新的时候不要
              data: JSON.parse(data)
            }
        })
      // } catch (err) {
      //   res.send({
      //     code:"ERROR_GETPROJECT",
      //     msg: "获取列表失败",
      //     data: {_id}
      //   })
      // }
    }
  },
  del:async (req, res)=>{
    let {_id} = req.body
    let oldData = await ProjectService.findOne({_id})

    //删除数据库info
    const result = await ProjectService.del({_id})
    console.log(oldData.data)
    //删除数据data 
    console.log(`data:${oldData.data}`)
    if(oldData.data != '9890a739f0d039b5d3a43414dd577641'){
      await fs.unlink(`public/projects/${oldData.data}`)
    }
    //删除收藏条例
    await CollectionService.unCollect({projectId:_id})

    res.send({
      code:"SUCCESS_DELPROJECT",
      msg: "项目已删除",
    })

  }
}
module.exports = ProjectController