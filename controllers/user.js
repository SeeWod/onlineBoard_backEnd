const UserService = require("../services/UserService");
const CollectionService = require("../services/CollectionService");
const JWT = require("../util/JWT")

const { verCodeSend } = require('../util/verCodeSend')
let codes = {} // 验证码缓存，暂时先放在内存里

const UserController = {
  //向用户邮箱发送验证信息
  verifyEmail:(req, res) => {
    let { email } = req.body //提取email 账号
    if(email) {
      let code = parseInt( 1000 + Math.random() * 8999 ) // 生成随机验证码
      codes[email] = code
      //发送验证邮件
      verCodeSend(email, code).then(() => {
        //60s后清除验证码
        // setTimeout(()=>{ delete codes[email] }, 60000)
        res.json({
          "code": "SUCCESS_VERIFYCODE_SEND", 
          "message": "验证码发送成功",
        })
      }).catch((err) => {
        res.json({  
          code: 'ERR_VERIFYCODE_FAILSEND',  
          message: '验证码发送失败',  
          data: {  
            email, //引发错误邮件名
            err 
          }  
        });  
      })
    } else {
      res.json({  
        code: 'ERR_EMAIL_ERR',  
        message: 'email参数错误',  
        data: { email }  
      });  
    }
  },
  //用验证信息进行用户登录
  verifyLogin_verCode:async (req,res)=>{
    let { email, verCode, autoLogin} = req.body
    if (email && verCode){
      // 判断验证码是否ok
      if (codes[email] === Number(verCode)) { // 邮箱作为用户名

        let result = await UserService.loginVCode({email})
        //查询成功登录 失败注册并返回用户
        if(!result){
          result = await UserService.add({email}) // 注册用户 
        }
        console.log(result)
        //生成token
        let token = null
        if(autoLogin){
          token  = JWT.generate({_id:result._id, email, autoLogin,},"30d")
        }else{
          token  = JWT.generate({_id:result._id, email, autoLogin,},"1h") 
        }
        res.header("Authorization",token)
        res.send({
            code:"SUCCESS_VERIFY",
            msg: "验证成功",
            data:{
              _id:result._id, //不需要，后续删除
              email: email,
              name: result.name,
              avatar: result.avatar,
              favorites: result.favorites,
            }
        })

      } else {
        return res.send({err: -1, msg: '参数错误'})
      }
    }else{
      res.send({code: 'ERR_VERIFYCODE_INVALID',  message: '验证码发送失败'})
    }
  },
  verifyLogin_password:async (req,res)=>{
    let { email, password, autoLogin} = req.body
    if (email && password){
      // 判断密码是否ok
      let result = await UserService.loginPassword({email,password})
      if(result){
        let token = null
        if(autoLogin){
          token  = JWT.generate({_id:result._id, email, autoLogin,},"30d")
        }else{
          token  = JWT.generate({_id:result._id, email, autoLogin,},"1h") 
        }

        res.header("Authorization",token)
        res.send({
            code:"SUCCESS_VERIFY",
            msg: "验证成功",
            data:{
              _id:result._id,
              email: email,
              name: result.name,
              avatar: result.avatar,
              favorites: result.favorites,
            }
        })
      } else {
        return res.send({err: -1, msg: '账户名或密码错误'})
      }
    }else{
      res.send({code: 'ERR_PASSWORD_INVALID',  message: '密码发送失败'})
    }
  },
  //用验证信息进行用户登录
  updateInfo:async (req, res)=>{
    const token = req.headers["authorization"].split(" ")[1]
    let payload = JWT.verify(token)

    let info = {...req.body}
    info.avatar = req.file?`/avataruploads/${req.file.filename}`:""
    //过滤掉空的信息
    for(let item in info){
      if(info[item] == ''){
        delete info[item]
      }
    }

    const result = await UserService.update(payload._id, {...info})

    if(info.password){
      delete info.password
    }
    //更新token
    res.send({
      code:"SUCCESS_MODIFY",
      msg: "项目同步成功",
      data:info
    })
  },

  addFavorite:async (req, res)=>{
    let {favoriteName} = req.body
    const token = req.headers["authorization"].split(" ")[1]
    var payload = JWT.verify(token)

    let userInfo = await UserService.find({_id:payload._id},{favorites:1})
    let favorites = userInfo.favorites
    //用户没有建立一个收藏夹
      if(favorites.length >= 10){
          res.send({
              code:"ERROR_FAVORITE-OVERLOAD",
              msg: "收藏夹数量超标",
          })
      }else{
          //检查 favoriteName 是否已存在
          if(favorites.some(favorite => favorite.name === favoriteName)){
              res.send({
                  code:"ERROR_FAVORITE-EXIST",
                  msg: "新建收藏夹失败-收藏夹已存在",
              })
          }else{
              favorites.push({
                name: favoriteName,
                amount: 0 
              })
          }
      }     

    let result = await UserService.updateFavorites({_id:payload._id,favorites})
    res.send({
        code:"SUCCESS_FAVORITE-ADD",
        msg: "新建收藏夹成功",
    })
  },
//renameFavorite
  updateFavorite:async (req, res)=>{
      let {favoriteName,reName} = req.body
      console.log(favoriteName,reName)
      const token = req.headers["authorization"].split(" ")[1]
      var payload = JWT.verify(token)

      let userInfo = await UserService.find({_id:payload._id},{favorites:1})
      let favorites = userInfo.favorites
    console.log(favorites)
      //检查 favoriteName 是否已存在
      let index = favorites.findIndex(favorite => favorite.name === favoriteName)
      if(index == -1){
          res.send({
              code:"ERROR_FAVORITE-EXIST",
              msg: "重命名收藏夹失败-重命名已存在或与原名称相同",
          })
      }else{
        console.log(index)
          favorites[index].name = reName
          let result = await UserService.updateFavorites({_id:payload._id,favorites})
          let result2 = await CollectionService.updateCollections({_id:payload._id,favoriteName,reName})
          res.send({
              code:"SUCCESS_FAVORITE-RENAME",
              msg: "重命名收藏夹成功",
          })
      }
  },
  deleteFavorite:async (req, res)=>{
    let {favoriteName} = req.body
    const token = req.headers["authorization"].split(" ")[1]
    var payload = JWT.verify(token)

    let userInfo = await UserService.find({_id:payload._id},{favorites:1})
    let favorites = userInfo.favorites

      //判断是否有 同名 文件夹
      let index = favorites.findIndex(favorite => favorite.name === favoriteName)
      if(index == -1){
          res.send({
              code:"ERROR_FAVORITE-UNEXIST",
              msg: "删除收藏夹失败-收藏夹不存在",
          })  
      }else{
          favorites.splice(index,1)
          console.log(favorites)
          let result = await UserService.updateFavorites({_id:payload._id,favorites})
          await CollectionService.unCollect({favorite:favoriteName, userId:payload._id})

          res.send({
              code:"SUCCESS_FAVORITE-DELETE",
              msg: "删除收藏夹成功",
          }) 
      }       
  },
}
module.exports = UserController

// const {username,introduction,gender} = req.body
// const token = req.headers["authorization"].split(" ")[1]
// const avatar = req.file?`/avataruploads/${req.file.filename}`:""
// var payload = JWT.verify(token)

// await UserService.upload({_id:payload._id,username,introduction,gender:Number(gender),avatar})
// if(avatar){
//     res.send({
//         ActionType:"OK",
//         data:{
//             username,introduction,
//             gender:Number(gender),
//             avatar
//         }
//     })
// }else{
//     res.send({
//         ActionType:"OK",
//         data:{
//             username,introduction,
//             gender:Number(gender),
//         }
//     })
// }