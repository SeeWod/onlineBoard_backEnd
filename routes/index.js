var express = require('express');
const multer  = require('multer')
const JWT = require("../util/JWT")
var router = express.Router();
const UserController = require('../controllers/user');
const ProjectController = require('../controllers/project');
const CollectionController = require('../controllers/collection');

const upload = multer({ dest: 'public/avataruploads/' })
const upload_coverImg = multer({ dest: 'public/coverImg_uploads/' })

//login路由登陆判断
router.post('/login/getMailCode', UserController.verifyEmail)
router.post('/login/verCodeLogin',UserController.verifyLogin_verCode)
router.post('/login/passwordLogin',UserController.verifyLogin_password)

//非login路由（保护数据安全）
router.use((req,res,next) =>{
  //如果授权有效 next
  const token = req.headers["authorization"].split(" ")[1]
  if(token){
    let payload = JWT.verify(token)
    if(payload){
      let newToken = null

      if(payload.autoLogin){
        newToken = JWT.generate({_id:payload._id, email:payload.email, autoLogin:payload.autoLogin}, "30d")
      }else{
        newToken = JWT.generate({_id:payload._id, email:payload.email, autoLogin:payload.autoLogin}, "1h")
      }
      res.header("Authorization",newToken)
      next()
    }else{
        //如果token过期，返回401错误，  未完成 
        res.status(401).send({
            code:"ERROR_TOKEN-EXPIRED",
            msg: "token已过期",
        })
    }
  }
})

//用户信息操作请求
router.post('/user/updateInfo',upload.single('avatar'),UserController.updateInfo)

//新建项目
router.post('/main/createProject',ProjectController.add)
router.post('/main/deleteProject',ProjectController.del)
router.post('/main/projectUpdate_info',ProjectController.updateInfo)
router.post('/main/projectUpdate_data',ProjectController.updateData)
router.post('/main/uploadCoverImg',upload_coverImg.single('coverImg'),ProjectController.uploadCoverImg)
router.get('/main/getProject',ProjectController.getOne)

//explore 展示所有项目
router.get('/main/getPublicProjects',ProjectController.getPublics)
//explore 展示所有项目
router.get('/main/getInvolvedProjects',ProjectController.getInvolved)

//收藏功能
router.post('/main/collectProject',CollectionController.collect)
router.post('/main/unCollectProject',CollectionController.unCollect)
router.post('/main/unCollectProject_P_favorites',CollectionController.unCollect_P_favorites)
// router.post('/main/updateCollectProject',CollectionController.cancelCollections)
router.get('/main/getCollections',CollectionController.getCollections)
router.get('/main/getProIsCollected',CollectionController.getProIsCollected)
router.get('/main/getCollectionCount',CollectionController.getCollectionCount)

router.post('/main/addFavorite', UserController.addFavorite)
router.post('/main/deleteFavorite', UserController.deleteFavorite)
router.post('/main/updateFavorite', UserController.updateFavorite)
//查找favorites，直接在获取用户信息就已经返回了

// /页面自动登录或者跳转倒登录页面
module.exports = router;