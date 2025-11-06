var express = require('express');
var router = express.Router();
const fs = require('fs');


/* GET users listing. */
router.get('/', function(req, res, next) {
  //show the data from data/user.json
  const usersData = fs.readFileSync('data/users.json', 'utf8');
  if (!usersData || usersData.length === 0) {
    return res.json({
      "status": "error",
      "message": "No users found"
    });
  }
  const usersArray = JSON.parse(usersData);
  const mappedUsersWithLink = usersArray.map(user => ({
    ...user,
    link: `/users/update/${user.id}`
  }));
  return res.json({
    "status": "success",
    "message": "Users found",
    "users": mappedUsersWithLink
  });
});

router.get('/register', function(req, res, next) {
  res.render('register', { title: 'Register' });
});

router.get('/html', function(req, res, next) {
  const users = fs.readFileSync('data/users.json', 'utf8');
  const usersArray = JSON.parse(users);
  res.render('users', { title: 'Users in HTML', users: usersArray });
});

router.get('/:id', function(req, res, next) {
  const { id } = req.params;
  const users = fs.readFileSync('data/users.json', 'utf8');
  const usersArray = JSON.parse(users);
  const user = usersArray.find(user => user.id === id);
  res.json(user);
});

router.get('/update/:id', function(req, res, next) {
  const { id } = req.params;
  const users = fs.readFileSync('data/users.json', 'utf8');
  const usersArray = JSON.parse(users);
  const user = usersArray.find(user => user.id === id);
  res.render('update', { title: 'Update', user: user });
});

//update using put method
router.put('/:id', function(req, res, next) {
  const { id } = req.params;
  const { username, email, password } = req.body;
  const users = fs.readFileSync('data/users.json', 'utf8');
  const usersArray = JSON.parse(users);
  const user = usersArray.find(user => user.id === id);
  user.username = username;
  user.email = email;
  user.password = password;
  fs.writeFileSync('data/users.json', JSON.stringify(usersArray, null, 2));
  res.json({ "status": "success", "message": "User updated" });
});

router.post('/', function(req, res, next) {
  const { username, email, password } = req.body;

  let usersArray = [];
  try {
    // Try to read and parse the file, but allow for empty or invalid JSON
    if (fs.existsSync('data/users.json')) {
      const users = fs.readFileSync('data/users.json', 'utf8').trim();
      if (users) {
        usersArray = JSON.parse(users);
        if (!Array.isArray(usersArray)) {
          usersArray = [];
        }
      }
    }
  } catch (err) {
    // If parsing fails, start with a clean array
    usersArray = [];
  }

  // Generate new id as string for consistency with GET by :id
  const id = (usersArray.length > 0) 
    ? String(Number(usersArray[usersArray.length - 1].id || 0) + 1)
    : '1';

  usersArray.push({ id, username, email, password });

  fs.writeFileSync('data/users.json', JSON.stringify(usersArray, null, 2));
  res.json({ "status": "success", "message": "User created" });
});

//delete using delete method
router.delete('/:id', function(req, res, next) {
  const { id } = req.params;
  const users = fs.readFileSync('data/users.json', 'utf8');
  const usersArray = JSON.parse(users);
  const user = usersArray.find(user => user.id === id);
  usersArray.splice(usersArray.indexOf(user), 1);
  fs.writeFileSync('data/users.json', JSON.stringify(usersArray, null, 2));
  res.json({ "status": "success", "message": "User deleted" });
});

module.exports = router;