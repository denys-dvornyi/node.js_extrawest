// index field?

import express, { Request, Response, Application } from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import exphbs from 'express-handlebars';
import {ObjectMapper} from 'json-object-mapper';
import url, {Url} from 'url';
import IRequest from '../lesson#5_fs_json_request/request/IRequest';
import RequestImpl from '../lesson#5_fs_json_request/request/requestImpl';
import PostJson from './model/json/postJson';
import CommentJson from './model/json/commentJson';
import Post from './model/db/post';
import Comment from './model/db/comment';
import PostDao from './dao/postDao';
import CommentDao from './dao/commentDao';
// import HttpHelper from './helpers/httpHelper';
import $ from 'jquery';

import { prop, Typegoose, ModelType, InstanceType } from 'typegoose';
import {connect} from 'mongoose';

import path from 'path';

const requestImpl: IRequest = new RequestImpl();
const PORT: number = 8080;
const API_URL: string = 'https://jsonplaceholder.typicode.com/';
const SESSION_PARAMS: any = {
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
};

const mongoUrl: string = 'mongodb://localhost:27017/test';
const options: any = {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true
};

connect(mongoUrl, options)
    .then(() => {console.log('connection success'); })
    .catch(() => {console.log('connection failed'); });

const app: Application = express();
app.use(bodyParser.urlencoded({extended: true})); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // parse application/json
app.use(cookieParser());
app.use(session(SESSION_PARAMS));

// ${p.comments.length}
app.engine('.hbs', exphbs({extname: '.hbs',
    helpers: {
        post: (p: Post) =>
            `<td>${p.id}</td><td>${p.userId}</td><td>${p.title}</td><td>${p.body}</td>
<td><a href="/comments?postId=${p.id}"></a></td><td></td>
<td><button onclick="$.ajax({
    type: 'DELETE',
    url: '/posts/${p.id}',
    success: (msg) => {
        alert('Data Deleted: ' + msg);
    }
});"><i class="fas fa-trash-alt"></i></button></td>`,
        comment: (c: Comment) =>
            `<td>${c.postId}</td><td>${c.id}</td><td>${c.name}</td><td>${c.email}</td><td>${c.body}</td>`,
    }}));
app.set('view engine', '.hbs');

app.get('/', (req: any, res: Response) => {
    res.send('MongoDB. Hello from Express.js');
});

app.get('/posts', async (req: Request, res: Response) => {
    const queryParams: Url = url.parse(req.url, true).query;
    // console.log('> queryParams: ', queryParams);
    // res.send(data);
    const postParams: PostJson = ObjectMapper.deserialize(PostJson, queryParams);
    // console.log('>> postParams: ', postParams);
    let posts: Post[] = [];
    const isEmpty: boolean = await PostDao.isEmpty();
    if (isEmpty) {
        console.log('Posts are empty!');
        console.log('Getting posts from API');
        const response: string = await requestImpl.get(API_URL + 'posts');
        const responsePosts: PostJson[] = ObjectMapper.deserializeArray(PostJson, response);
        console.log('Saving post from API to DB');
        for (const responsePost of responsePosts) { // add responsePosts to DB
            console.log('responsePost: ', responsePost);
            const post: any = {
                id: responsePost.id,
                title: responsePost.title,
                body: responsePost.body,
                userId: responsePost.userId
            };
            await PostDao.addPost(post);
        }
    }
    posts = await PostDao.getPosts(postParams);
    console.log('getPosts: ', posts);
    // res.send(posts);
    res.render('posts.hbs', {
        layout: false,
        posts
    });
});

app.get('/posts/:postId', async (req: Request, res: Response) => {
    const postId: number = req.params.postId;
    console.log('> postId: ' + postId);
    const post: Post = await PostDao.getPostById(postId);
    if (null === post) {
        console.log(`Getting posts with id=${postId} from API`);
        try {
            const response: string = await requestImpl.get(`${API_URL}posts/${postId}`);
            const responsePost: PostJson = ObjectMapper.deserialize(PostJson, response);
            const newPost: any = {
                id: responsePost.id,
                title: responsePost.title,
                body: responsePost.body,
                userId: responsePost.userId
            };
            await PostDao.addPost(newPost);
        } catch (error) {
            console.log('Server error: ', error);
            res.send('Post not found!');
        }
    }
    const posts: Post[] = [];
    posts.push(post);
    res.render('posts', {
        layout: false,
        posts
    });
});

app.post('/posts', async (req: Request, res: Response) => {
    console.log('adding new post');
    const post: any = {
        title: req.body.title,
        body: req.body.body,
        userId: req.body.userId
    };
    if (req.body.id) { post.id = req.body.id; }
    await PostDao.addPost(post);
    res.status(200).json({status: 'ok'});
    console.log('post added!');
});

// app.put('/posts', async (req: Request, res: Response) => {
//     const existingPost: Post = await PostDao.getPostById(req.body.id);
//     const post: Post = existingPost ? existingPost : new Post();
//     if (null === existingPost) {
//         post.id = req.body.id;
//         post.title = req.body.title;
//         post.body = req.body.body;
//         post.userId = req.body.userId;
//         console.log('adding new post');
//         await PostDao.addPost(post);
//         console.log('post added!');
//     } else {
//         console.log('updating old post');
//         await PostDao.updatePost(post);
//         console.log('post updated!');
//     }
//     res.status(200).json({status: 'ok'});
// });

app.delete('/posts', async (req: Request, res: Response) => {
    // console.log('req.body: ', req.body);
    // console.log('req.body.data: ', req.body.data);
    let postParams: PostJson = new PostJson();
    if (req.body.data) {
        postParams = ObjectMapper.deserialize(PostJson, req.body.data);
    }
    console.log('delete postParams: ', postParams);
    await PostDao.deletePost(postParams);
    res.status(200).json({status: 'ok'});
});

app.get('/comments', async (req: Request, res: Response) => {
    const queryParams: Url = url.parse(req.url, true).query;
    // console.log('> queryParams: ', queryParams);
    // res.send(data);
    const commentParams: CommentJson = ObjectMapper.deserialize(CommentJson, queryParams);
    // console.log('>> commentParams: ', commentParams);
    let comments: Comment[] = [];
    const isEmpty: boolean = await CommentDao.isEmpty();
    if (isEmpty) {
        console.log('Getting comments from API');
        const response: string = await requestImpl.get(API_URL + 'comments');
        const responseComments: CommentJson[] = ObjectMapper.deserializeArray(CommentJson, response);
        // console.log('>>> responseComments: ', responseComments);
        // console.log('Saving comment from API to DB');
        for (const responseComment of responseComments) { // add responseComments to DB
            // const comment: Comment = new Comment();
            // comment.name = responseComment.name;
            // comment.email = responseComment.email;
            // comment.body = responseComment.body;
            // comment.postId = responseComment.postId;
            const comment: any = {
                id: responseComment.id,
                name: responseComment.name,
                email: responseComment.email,
                body: responseComment.body,
                postId: responseComment.postId
            };
            console.log('>>>. comment to add: ', comment);
            await CommentDao.addComment(comment);
        }
    }
    comments = await CommentDao.getComments(commentParams);
    // res.send(comments);
    res.render('comments.hbs', {
        layout: false,
        comments
    });
});

app.post('/comments', async (req: Request, res: Response) => {
    console.log('adding new comment');
    const comment: any = {
        name: req.body.name,
        email: req.body.email,
        body: req.body.body,
        postId: req.body.postId
    };
    if (req.body.id) { comment.id = req.body.id; }
    await CommentDao.addComment(comment);
    res.status(200).json({status: 'ok'});
    console.log('comment added!');
});

app.listen(PORT);
