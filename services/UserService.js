const { ObjectId } = require("mongodb")
const database  = require("../config/db.config")
const users = database.collection('users');

const UserService = {
    loginVCode:async({email})=>{
        //应该是执行完await， 再return
        return await users.findOne({email})
    },
    find:async({_id})=>{
        //应该是执行完await， 再return
        return await users.findOne({_id: new ObjectId(_id)})
    },
    loginPassword:async({email,password})=>{
        return await users.findOne({email,password})
    },
    add:async ({email}) => {
        return users.insertOne({
            email,
            favorites: [{name: "默认收藏夹", amount: 0}],
            avatar: "/avataruploads/defaultAvatar.jpg"
        })
    },
    update:async(id, newInfo) => {
        //不允许更改邮箱
        return users.updateOne(
            {_id: new ObjectId(id)},
            {$set:newInfo},
        )
    },
    updateFavorites:async ({_id,favorites})=>{
        console.log(_id)
        return users.updateOne(
            {_id: new ObjectId(_id)},
            {$set: {favorites}},
        )
    },
    updateFavoriteAmount:async ({_id,favoriteName, num})=>{
        let user =  await users.findOne({_id: new ObjectId(_id)})
        let favorites = user.favorites
        let index = favorites.findIndex(favorite => favorite.name == favoriteName)
        console.log(favorites, index, favoriteName)
        favorites[index].amount = favorites[index].amount + num

        return users.updateOne(
            {_id: new ObjectId(_id)},
            {$set: {favorites}},
        )
    },
}
module.exports = UserService