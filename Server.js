const express = require("express");
const formData = require("./Model");
const User = require('./PostModel')
const Like = require('./LikesMOdel')
const reports = require('./ReportModel')
const { OTP } = require("./OtpModel");
const path = require("path");
const bodyParser = require("body-parser");
const multer = require("multer");
const dbconnect = require("./Atlas");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");
const { log } = require("console");
const messages = require("./MessageModel.");
const follow = require("./FollowModel");
const Notification = require("./NotificationModel");
require("dotenv").config();


// const MyFun = 
// MyFun()




const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use("/public", express.static(path.join(__dirname, "public")));

// app.use(express.urlencoded());
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/image");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

// app.get("/image/:imgName",  async (req,res)=>{
// const imgName = req.params.imgName
  
//   const imgPath = path.join(__dirname,'/img/myimg/'+imgName)
//   console.log(imgPath);
//   res.sendFile(imgPath)
  
// })


// sendFile

const upload = multer({ storage });

app.post("/post", upload.single("profilePicture"), async (req, res) => {
  try {
    const { email, userName } = req.body;

    const existingUser = await formData.findOne({
      $or: [{ email }, { userName }],
    });

    if (existingUser) {
      const errors = {};
      if (existingUser.email === email) {
        errors.email = "Email already exists";
      }
      if (existingUser.userName === userName) {
        errors.userName = "Username already exists";
      }
      return res.status(400).json({ errors });
    }

    const saltRound = 10;
    const hashedPassword = await bcrypt.hash(req.body.password, saltRound);

    const data = {
      ...req.body,
      profilePicture: req.file ? req.file.filename : null,
      password: hashedPassword,
    };

    const val = await formData.create(data);
    res.json(val);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

app.post("/login", async (req, resp) => {
  try {
    const { email, password } = req.body;
    console.log(email, password);
    const user = await formData.findOne({ email });

    if (!user) {
      return resp.status(400).send("User not found");
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return resp.status(400).json("Invalid password");
    }
    resp.json("Login successful");
  } catch (error) {
    console.error("Error during login:", error);
    resp.status(500).send("An error occurred during login. Please try again.");
  }
});
app.get("/user", async (req, resp) => {
  try {
    const data = await formData.find();
    resp.send(data);
  } catch (error) {
    console.log(error);
    resp.status(500).send(error);
  }
});
app.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  console.log(userId);
  try {
    // Assuming userId is a string and not an ObjectId
    const user = await formData.findOne({ email: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: error.message });
  }
});
app.get("/userid/:id", async (req, res) => {
  const { id } = req.params;
  console.log(id);
  
  try {
    const user = await formData.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: error.message });
  }
});



app.get("/useremail", async (req, res) => {
  try {
    const { email } = req.query;  

    if (typeof email !== "string") {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await formData.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({ message: "Email not found" });
    }

    res.json(existingUser); 
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});



const update = multer({ storage });

app.put(
  "/updatedata/:id",
  update.single("profilePicture"),
  async (req, resp) => {
    const { id } = req.params;

    const data = {
      ...req.body,
      profilePicture: req.file ? req.file.filename : undefined,
    };
    console.log(data);

    Object.keys(data).forEach((key) => {
      if (data[key] === undefined) {
        delete data[key];
      }
    });

    try {
      const updatedData = await formData.findByIdAndUpdate(id, data, {
        new: true,
      });
      resp.json(updatedData);
    } catch (error) {
      console.log(error);
      resp.status(500).send(error);
    }
  }
);

app.delete("/delete/:id", async (req, resp) => {
  const { id } = req.params;
  try {
    await formData.findByIdAndDelete(id);
    resp.json("delete succesfully");
  } catch (error) {
    resp.status(500).send(error);
  }
});

// ..............resset Password.......................
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

app.post("/sendotp", async (req, res) => {
  try {
    const { email } = req.body;

    if (typeof email !== "string") {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await formData.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({ message: "Email not found" });
    }

    const otp = otpGenerator.generate(6, {
      digits: true,
      upperCase: false,
      specialChars: false,
    });

    await OTP.findOneAndUpdate(
      { email },
      { otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is: ${otp}. It is valid for 10 minutes.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error.message);
        return res.status(500).json({ message: "Error sending OTP email" });
      } else {
        console.log("Email sent:", info.response);
        return res.json({ message: "OTP sent successfully" });
      }
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;
    console.log(newPassword);

    const otpRecord = await OTP.findOne({ email });
    if (!otpRecord) {
      return res.status(400).json({ message: "OTP not found for this email." });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    if (Date.now() > otpRecord.createdAt.getTime() + 10 * 60 * 1000) {
      return res.status(400).json({ message: "OTP has expired." });
    }

    const user = await formData.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    await OTP.deleteOne({ email });

    res.json({ message: "Password has been reset successfully." });
  } catch (error) {
    console.error("Error during password reset:", error);

    res.status(500).json({ message: "Internal server error" });
  }
});

// ...................Resset Password......................



app.put("/changePassword/:id", async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  console.log(req.body);

  if (!id || !currentPassword || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (newPassword !== confirmNewPassword) {
    return res
      .status(400)
      .json({ error: "New password and confirmation do not match" });
  }

  try {
    const user = await formData.findById(id);
    if (!user) {

      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res
      .status(500)
      .json({ error: "An error occurred while changing the password" });
  }
});

// .............................CreatePostApi..............................

const storagee = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/PostImage"); 
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});

const uploadd = multer({ storage: storagee });

app.post('/createpost', uploadd.single('image'), async (req, res) => {
  const { username, title, description } = req.body;
  const image = req.file ? req.file.filename : null;

  console.log('Image path:', image);

  if (!username || !title || !description) {
    return res.status(400).send({ error: 'Missing required fields' });
  }

  const newPost = {
    username,
    title,
    description,
    image,
    status: 'active' 
  };

  try {
   
    const post = await User.create(newPost);
    return res.status(201).json({ message: 'Post created successfully', post });
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      return res.status(500).send({ error: error.message });
    }
  }
});


app.get('/userrpost/:username', async (req, res) => {
  try {
      const { username } = req.params;
      
      const user = await User.find({ username })

      if (!user) {
          return res.status(404).send({ message: 'User not found' });
      }

      res.status(200).send(user);
  } catch (error) {
      console.error(error);
      res.status(500).send({ error: error.message });
  }
});


app.get('/userrposts/:username', async (req, res) => {
  const { username } = req.params;
      const formDataData = await formData.find();
      const reportsdata = await reports.find();
      const data = [];
      
      reportsdata.forEach(report => {
        if (report && report.postid && report.username) {
          const postid = report.postid;
          const username = report.username;
          const val = { username: username, _id: postid };
          data.push(val);
        }
      });
      
      // console.log('vaallll', data);
      
      

  try {
    const userData = await User.aggregate([
      { $match: {
        username: { $ne: username },
        status: { $ne: 'deactivate' }
      } },
    ]);
   
    if (userData.length > 0) {
            for(let i=0;i<userData.length;i++)
            {
                // userData[i].names = await formData.find({name:'name',postid:userData[i]._id});
                userData[i].liked= await Like.countDocuments({userlike:'1',postid:userData[i]._id});
                userData[i].disliked= await Like.countDocuments({userlike:'0',postid:userData[i]._id});

            }
             
            const filteredUserData = userData.filter(user => {
              return !data.some(report =>  report.username === username && report._id.toString() === user._id.toString());
            });
            const combinedData = filteredUserData.map(user => ({
                ...user, 
                name: formDataData.find(item => item.userName === user.username).name,
                userid: formDataData.find(item => item.userName === user.username)._id
              }));
              
    res.send(combinedData);
 }else {
      res.status(404).send({ message: 'No posts found that do not match the given username and are not deactivated' });
    }
  } catch (error) {
    console.log('Failed to get data:', error.message);
    res.status(500).send({ error: error.message });
  }
});




const mongoose = require('mongoose');

app.get('/userrpostss/:postid', async (req, res) => {
  const { postid } = req.params;
  console.log('Received postid:', postid);
  
  try {
    const postObjectId = new mongoose.Types.ObjectId(postid);
    
    const userData = await User.aggregate([
      { $match: { _id: postObjectId } }
    ]);
    console.log('UserData:', userData);

    if (userData.length > 0) {
      const post = userData[0]; 

      console.log('Finding likes for postid:', postid);
      
      const likedCount = await Like.countDocuments({ userlike: '1', postid: postid });
      const dislikedCount = await Like.countDocuments({ userlike: '0', postid: postid });

      post.liked = likedCount;
      post.disliked = dislikedCount;
      
      console.log('Likes count:', post.liked);
      console.log('Dislikes count:', post.disliked);
      
      res.send({ post });
    } else {
      res.status(404).send({ message: 'No post found or post is deactivated' });
    }
  } catch (error) {
    console.log('Failed to get data:', error.message);
    res.status(500).send({ error: error.message });
  }
});



app.delete('/postdelete/:id', async (req, resp) => {
  try {
      const postId = req.params.id;
      
      const result = await User.updateOne(
          { "posts._id": postId },
          { $pull: { posts: { _id: postId } } }
      );
      
      if (result.nModified === 0) {
          return resp.status(404).json({ message: 'Post not found' });
      }

      resp.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
      console.error('Error deleting post:', error);
      resp.status(500).json({ message: 'Server error' });
  }
});

// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<user likes>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>



app.post('/userlike', async (req, res) => {
  const { postid, userid, userlike, username } = req.body;

  try {
    if (!postid || !userid || typeof userlike !== 'number' || !username) {
      return res.status(400).json({ message: 'Missing or invalid required fields' });
    }

    const existingLike = await Like.findOne({ postid, userid });

    if (existingLike) {
      existingLike.userlike = userlike;
      await existingLike.save();
      return res.status(200).json({
        message: `You have successfully ${userlike === 1 ? 'liked' : 'unliked'} the post`,
        like: existingLike
      });
    }

    const newLike = new Like({ postid, userid, username, userlike });
    await newLike.save();

    res.status(200).json({
      message: `You have successfully ${userlike === 1 ? 'liked' : 'unliked'} the post`,
      like: newLike
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


app.get('/userlike/status', async (req, res) => {
  const { postid, userid } = req.query;

  if (!postid || !userid) {
    return res.status(400).json({ message: 'Post ID and User ID are required' });
  }

  try {
    const like = await Like.findOne({ postid, userid });
    
    
    
    if (like) {
      return res.status(200).json({ userlike: like.userlike });
    } else {
      
      return res.status(200).json({ userlike: 0 });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

app.get('/userlikecount/:postid', async (req, resp) => {
  try { 
    const { postid } = req.params;
console.log('something',postid);

    const liked= await Like.countDocuments({userlike:'1',postid})
    const disliked= await Like.countDocuments({userlike:'0',postid})

    const likeData = await Like.find({ postid: postid });


    const username = likeData.map(like => like.username);
   resp.json({
      success: true,
      likeCount: liked,
      dislikeCount: disliked,
      username: username,
      postid:postid
    });
  } catch (error) {
    console.error('Error fetching like data:', error);
    resp.status(500).json({ success: false, message: 'Server error' });
  }
});

// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<report api>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

app.post('/report',async(req,resp)=>{
  try {
    const data = req.body
    const res = await reports.create(data)
    if(res){
      resp.status(200).json({success: true, message: 'report submit seccesfull'})
      console.log(res);
      
    }
    
  } catch (error) {
    console.log('error data not created', error);
    resp.status(500).json({success:false, message: 'report not submited'})
    
  }
});

app.get('/reportdata', async (req, resp) => {
  try {
    
    

    var reportsData =  await reports.aggregate([
            {
                $match: {}
            },
                            
            ]);
            await User.populate(reportsData, { path: 'postid'});
            resp.send(reportsData);
  
  } catch (error) {
    resp.status(500).json({success:false,errors:error})
  }
});


// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<statusupdate>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

app.put('/updatestatus/:userId/:postId', async (req, res) => {
  try {
    const { userId, postId } = req.params;
    const { status } = req.body; 

    const response = await User.findOneAndUpdate(
      { username: userId, '_id': postId }, 
      { $set: { 'status': status } }, 
      { new: true }
    );

    if (response) {
      console.log('Updated post status:', response);
      res.status(200).send({ message: 'Post status updated successfully', data: response });
    } else {
      res.status(404).send({ message: 'User or Post not found' });
    }
  } catch (error) {
    console.error('Error updating post status:', error);
    res.status(500).send({ message: 'Failed to update post status' });
  }
});


// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<Message>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>


app.post('/message', async (req, resp) => {
  try {
    console.log('Request Body:', req.body);
    const { mess } = req.body; 
    console.log('Extracted Message:', mess);
    
    const val = await messages.create(mess);
    return resp.status(201).json({ message: 'Message created successfully', val }); 
  } catch (error) {
    console.log('Error sending message', error); 
    resp.status(500).send({ message: 'Failed to send message' }); 
  }
});
app.get('/findmessage/:id', async (req, resp) => {
  try {
    const id = req.params.id; 
    const res = await messages.find({ postid: id }).populate({path:'UserID', select: 'name _id profilePicture'})
    console.log('Message found by the ID');
    resp.status(200).send(res); 
  } catch (error) {
    console.log('Getting message failed', error);
    resp.status(500).send({ error: 'Failed to retrieve messages' }); 
  }
});



// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<Follow Apissss>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>


app.post('/follow', async (req, resp) => {
  try {
    const data = req.body;
    console.log('follow', data);
    const existingFollow = await follow.findOne({ followId: data.followId, UserID: data.UserID, userName: data.username });

    if (existingFollow) {
      await follow.deleteOne({ _id: existingFollow._id });
      console.log('Unfollowed successfully');
      return resp.status(200).send('Unfollowed successfully');
    }

    const val = await follow.create(data);
    if (val) {
      console.log('Followed successfully', val);
      return resp.status(201).send('Followed successfully');
    }
  } catch (error) {
    console.log('Follow failed');
    resp.status(500).send({ message: 'Failed to follow', error });
  }
});


app.get('/followedPost/:id', async (req, resp) => {
  try {
    const userid = req.params.id;
    console.log('User ID:', userid);

    const followedUsers = await follow.find({ UserID: userid });
    const followedUsernames = followedUsers.map(f => f.followUserName);
    console.log('Followed Usernames:', followedUsernames);

    const followposts = await User.aggregate([
      { $match: { username: { $in: followedUsernames } } },
      {
        $project: {
          _id: 1,
          username: 1,
          title: 1,
          description: 1,
          image: 1,
          liked: 1,
          disliked: 1,
        }
      }
    ]);

    if (followposts.length > 0) {
      await Promise.all(followposts.map(async (post) => {
        post.liked = await Like.countDocuments({ userlike: '1', postid: post._id });
        post.disliked = await Like.countDocuments({ userlike: '0', postid: post._id });
      }));
    }
    const formDataData = await formData.find();
    const combinedData = followposts.map(post => {
      const user = formDataData.find(item => item.userName === post.username);
      const userName = formDataData.find(item => item.userName === post.username).name;
      return {
        ...post,
        userid: user ? user._id : null,
        Name: userName 
      };
    });

    resp.send(combinedData);
    console.log('Followed Posts:', combinedData);

  } catch (error) {
    console.error('Failed to get posts', error);
    resp.status(500).send({ message: 'Failed to get posts', error });
  }
});

app.get('/followAction', async(req,resp)=>{
  try {
const data = await follow.find()
resp.send(data).status(500)
console.log("followAction successfull find", data);

  } catch (error) {
    resp.send({message:'failed to FollowAction Find' ,error})
  }
})


// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<NOtifications Message>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>


app.post('/notification', async(req,resp)=>{
  try {
    const data = req.body
    const val = await Notification.create(data)
    if(val){
      resp.send({message:'notification Send',val})
      console.log('Notification', val);
      
    }
  } catch (error) {
    resp.send({message:'Failed To Send Notification'})
    console.log('failed to send notification', error);
     
  }
})

app.get('/getnotification/:id', async (req, resp) => {
  try {
    const postUserId = req.params.id;
    console.log(postUserId);
    
    const finds = await Notification.find({postuserid: postUserId });

    const statusZeroCount = await Notification.countDocuments({ postuserid: postUserId, Status: 0 });

    const statusOneCount = await Notification.countDocuments({ postuserid: postUserId, Status: 1 });

    if (finds.length > 0) {
      resp.status(200).json({
        finds,
        statusOneCount,
        statusZeroCount
      });
      console.log('Notifications fetched successfully');
    } else {
      resp.status(404).json({ message: 'No notifications found for this user' });
    }
  } catch (error) {
    console.error('Failed to get notifications:', error);
    resp.status(500).json({ message: 'Failed to get notifications', error });
  }
});

app.put('/notificationStatus/:id/:Idd', async (req, res) => {
  try {
    const userId = req.params.id;
    const postid = req.params.Idd
    console.log('notification id',userId);  
    console.log('notification postid',postid);  

    
    const updatedNotifications = await Notification.updateMany(
      { postuserid: userId, postid: postid }, 
      { $set: { Status: 1 } }  
    );

    if (updatedNotifications.matchedCount === 0) {
      return res.status(404).json({ message: 'No notifications found for this user' });
    }

    const d=res.status(200).json({ 
      message: 'All notifications updated successfully', 
      matchedCount: updatedNotifications.matchedCount,
      modifiedCount: updatedNotifications.modifiedCount 
    });
    console.log('ddddddd',d);
    
  } catch (error) {
    console.error('Error updating notifications:', error);
    res.status(500).json({ message: 'Error updating notifications', error });
  }
});


app.listen(5252, () => {
  console.log("Server started on port 5252");
});
