const { Post } = require('../db/models');

class PostService {
    // C
    static createPost(postData) {
        return Post.create(postData).then((newPost) => newPost.get());
    }

    // R
    static getAllPosts() {
        return Post.findAll().then((rows) => rows.map((post) => post.get()));
    }

    static async getPostById(postId) {
        const post = await Post.findByPk(postId);
        if (!post) {
            return null;
        }
        return post.get();
    }

    // U
    static async updatePost(postId, authorId, { title, content }) {
        const post = await Post.findByPk(postId);
        if (!post) {
            return { error: 'not_found' };
        }
        if (Number(post.user_id) !== Number(authorId)) {
            return { error: 'forbidden' };
        }
        await post.update({ title, content });
        return post.get();
    }

    // D
    static async deletePost(postId, authorId) {
        const post = await Post.findByPk(postId);
        if (!post) {
            return { error: 'not_found' };
        }
        if (Number(post.user_id) !== Number(authorId)) {
            return { error: 'forbidden' };
        }
        await post.destroy();
        return { deleted: true };
    }
}

module.exports = PostService;
