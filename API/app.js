const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { mongoose } = require('./db/mongoose');

//Load in mongoose models
const {List, Task, User} = require('./db/models');
//const { User } = require('./db/models/user.model');

const jwt = require('jsonwebtoken');

//Load middleware
app.use(bodyParser.json());


// CORS HEADERS MIDDLEWARE
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS, PUT, PATCH, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token, x-refresh-token, _id");

    res.header(
        'Access-Control-Expose-Headers',
        'x-access-token, x-refresh-token'
    );

    next();
});


let authenticate = (req, res, next) => {
    let token = req.header('x-access-token');

    // verify the JWT
    jwt.verify(token, User.getJWTSecret(), (err, decoded) => {
        if (err) {
            res.status(401).send(err);
        } else {
            req.user_id = decoded._id;
            next();
        }
    });
}


let verifySession = (req, res, next) => {
    // grab the refresh token from the request header
    let refreshToken = req.header('x-refresh-token');

 
    let _id = req.header('_id');

    User.findByIdAndToken(_id, refreshToken).then((user) => {
        if (!user) {
    
            return Promise.reject({
                'error': 'User not found. Make sure that the refresh token and user id are correct'
            });
        }


        req.user_id = user._id;
        req.userObject = user;
        req.refreshToken = refreshToken;

        let isSessionValid = false;

        user.sessions.forEach((session) => {
            if (session.token === refreshToken) {
                // check if the session has expired
                if (User.hasRefreshTokenExpired(session.expiresAt) === false) {
                    // refresh token has not expired
                    isSessionValid = true;
                }
            }
        });

        if (isSessionValid) {
           
            next();
        } else {
            // the session is not valid
            return Promise.reject({
                'error': 'Refresh token has expired or the session is invalid'
            })
        }

    }).catch((e) => {
        res.status(401).send(e);
    })
}


/* LIST ROUTES */

//GET LIST
//Purpose: Get all lists
app.get('/lists', authenticate, (req, res) =>{
    //returns array of lists in the database
    List.find({
       _userId: req.user_id
    }).then((lists)=>{
        res.send(lists);
    }).catch((e) =>{
        res.send(e);
    })
});


//POST LIST
//Purpose: Create new lists
app.post('/lists', authenticate, (req,res) =>{
    //create new list
    let title = req.body.title;

    let newList = new List({
        title, 
        _userId: req.user_id
    });
    newList.save().then((listDoc)=>{
        //returns full list document
        res.send(listDoc);
    })
});
app.patch('/lists/:id', authenticate, (req,res) =>{
    List.findOneAndUpdate({_id: req.params.id, _userId: req.user_id}, {
        $set: req.body
    }).then(() =>{
        res.send({'message': 'success!'});
    });
});

app.delete('/lists/:id', authenticate, (req,res) =>{
    List.findOneAndRemove({
        _id: req.params.id,
        _userId: req.user_id 
    }).then((removedListDoc) =>{
        res.send(removedListDoc);
        deleteTasksFromList(removedListDoc._id);
    })
});

app.get('/lists/:listId/tasks', authenticate, (req, res) =>{
    Task.find({
        _listId: req.params.listId
    }).then((tasks) =>{
        res.send(tasks);
    })
});

app.get('/lists/:listId/tasks/:taskId', (req, res) =>{
    Task.findOne({
        _id: req.params.taskId,
        _listId: req.params.listId
    }).then((task) =>{
        res.send(task);
    })
});

app.post('/lists/:listId/tasks', authenticate, (req, res) =>{

    List.findOne({
        _id: req.params.listId,
        _userId: req.user_id
    }).then((list)=>{
        if(list){
            return true;
        }
        return false;
    }).then((canCreateTask)=>{
        if(canCreateTask){
            let newTask = new Task({
                title: req.body.title,
                _listId: req.params.listId
            });
           newTask.save().then((newTaskDoc) =>{
                res.send(newTaskDoc);
           })
        }else{
            res.sendStatus(404);
        }
    })
});

app.patch('/lists/:listId/tasks/:taskId', authenticate, (req, res) =>{
    //update existing list
    List.findOne({
        _id: req.params.listId,
        _userId: req.user_id
    }).then((list)=>{
        if(list){
            return true;
        }
        return false;
    }).then((canUpdateTasks)=>{
        if(canUpdateTasks){
            Task.findOneAndUpdate({
                _id: req.params.taskId,
                _listId: req.params.listId
            }, {
                $set: req.body
            }
            ).then(() =>{
                res.send({message: 'updated'});
            })
        }else{
            res.sendStatus(404);
        }
         
    }) 
});

app.delete('/lists/:listId/tasks/:taskId', authenticate, (req,res) =>{
    //delete task
    List.findOne({
        _id: req.params.listId,
        _userId: req.user_id
    }).then((list)=>{
        if(list){
            return true;
        }
        return false;
    }).then((canDeleteTasks)=>{
        if(canDeleteTasks){
            Task.findOneAndRemove({
                _id: req.params.taskId,
                _listId: req.params.listId
             //   _listId: req.params.listId
            }).then((removedTaskDoc) =>{
                res.send(removedTaskDoc);     
            })
        }else{
            res.sendStatus(404);
         }
        })
    });

    

//User routes

app.post('/users', (req, res) => {
    // User sign up

    let body = req.body;
    let newUser = new User(body);

    newUser.save().then(() => {
        return newUser.createSession();
    }).then((refreshToken) => {
 

        return newUser.generateAccessAuthToken().then((accessToken) => {
           
            return { accessToken, refreshToken }
        });
    }).then((authTokens) => {
       
        res
            .header('x-refresh-token', authTokens.refreshToken)
            .header('x-access-token', authTokens.accessToken)
            .send(newUser);
    }).catch((e) => {
        res.status(400).send(e);
    })
})


/**
 * POST /users/login
 * Purpose: Login
 */
app.post('/users/login', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    User.findByCredentials(email, password).then((user) => {
        return user.createSession().then((refreshToken) => {
         

            return user.generateAccessAuthToken().then((accessToken) => {
               
                return { accessToken, refreshToken }
            });
        }).then((authTokens) => {
            
            res
                .header('x-refresh-token', authTokens.refreshToken)
                .header('x-access-token', authTokens.accessToken)
                .send(user);
        })
    }).catch((e) => {
        res.status(400).send(e);
    });
})

app.get('/users/me/access-token', verifySession, (req, res) => {
    req.userObject.generateAccessAuthToken().then((accessToken) => {
        res.header('x-access-token', accessToken).send({ accessToken });
    }).catch((e) => {
        res.status(400).send(e);
    });
})

let deleteTasksFromList = (_listId) =>{
    Task.deleteMany({
        _listId
    }).then(()=>{
        console.log("tasks from " + _listId + "were deleted");
    })
}
app.listen(3000, ()=>{
    console.log('server is listening on port 3000');
});