import { isAdmin } from "./helpers.js"; 

const signup_form = document.getElementById("signup");
const signup_user = document.getElementById("new_username");
const signup_pass = document.getElementById("new_password");

const login_form = document.getElementById("login");
const login_user = document.getElementById("username");
const login_pass = document.getElementById("password");

signup_form.addEventListener("submit", signup);
login_form.addEventListener("submit", login);


function getLogins() {
  const raw = localStorage.getItem("loginData");
  return raw ? JSON.parse(raw) : [];
}

function entryExists(username) {
  const entries = getLogins();
  return entries.some(e => e.username === username);
}

function validLogin(username,password){
    const entries = getLogins();
    return entries.some(e=> e.username === username && e.password ===password);
}


function signup(event) {
  event.preventDefault();
  const username = signup_user.value.trim();
  const password = signup_pass.value;


  if (entryExists(username)) {
    console.log("Username already taken.");
    return;
  }

  // add the account
  const entries = getLogins();
  entries.push({
    username,
    password
  });
  localStorage.setItem("loginData", JSON.stringify(entries));

  // create a storage for them
  localStorage.setItem(`user:${username}:data`, JSON.stringify([]));
  console.log("Saved:", entries);

  //also log in

  sessionStorage.setItem("currentUser", username);
  if (isAdmin(username)){
    window.location.href = "admin.html";
  }
  else{
    window.location.href = "driver.html";}    
  



}

function login(event){
    event.preventDefault();

    const username = login_user.value.trim();
    const password = login_pass.value;

    if(validLogin(username,password)){
        sessionStorage.setItem("currentUser", username);
        if (isAdmin(username)){
          window.location.href = "admin.html";
        }
        else{
          window.location.href = "driver.html";}    
        }
    else{
        console.log("Incorrect password.");
        return;
    }
}

