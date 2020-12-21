const { User } = require('../models');
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) { 
                const userData = await User.findOne({_id: context.user._id})
                        .select('-__v -password')
                        .populate('books')
                        // .populate('friends');
            
                return userData;
            }
            throw new AuthenticationError('Not logged in');
        },

        // get a user by username
        // user: async (parent, { username }) => {
        //     return User.findOne({ username })
        //         .select('-__v -password')
        //         .populate('books')
        //         // .populate('thoughts');
        // },
        
        // get all users
        users: async () => {
            return User.find()
            .select('-__v -password')
            // .populate('friends')
            // .populate('thoughts');
        },
    },
    Mutation: {
        // create a user, sign a token, and send it back (to client/src/components/SignUpForm.js)
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);
            return { token, user };
        },
        
        // login a user, sign a token, and send it back (to client/src/components/LoginForm.js)
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });

        if (!user) {
            throw new AuthenticationError('Incorrect credentials');
        }

        const correctPw = await user.isCorrectPassword(password);

        if (!correctPw) {
            throw new AuthenticationError('Incorrect credentials');
        }
        const token = signToken(user);
        return { token, user };
        }, 
        
        // save a book to a user's `savedBooks` field by adding it to the set (to prevent duplicates)
        saveBook: async (parent, args, context) => {
            if (context.user) {
              const book = await Book.create({ ...args, username: context.user.username });
          
              await User.findByIdAndUpdate(
                { _id: context.user._id },
                { $push: { books: book._id } },
                { new: true }
              );
          
              return book;
            }
          
            throw new AuthenticationError('You need to be logged in!');
        },

        // remove a book from `savedBooks`

    }

}


module.exports = resolvers;