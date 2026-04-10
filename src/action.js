import { getLogins,isAdmin } from "./helpers.js"; 


// ======= Module state (exportable) =======
export let drivers = ["mary","sam"];
export let assignedScans = {};
export let driverInfo = [];
export let currentDriver = "admin";
export let currentUser = sessionStorage.getItem("currentUser");

// ======= DOM references (top-level, unassigned) =======
export let usernameDisplay;
export let pdfInput;
export let scanBtn;
export let scanDropdown;
export let pdfLink;
export let scanBlock;
export let loadingText;
export let pickupBox;
export let fuelBox;          
export let fuelAddr ;       
export let fuelTime ;         
export let addFuelBtn ;
export let deliveryBox;
export let driverDropdown;
export let scanningArea;
export let driverDisplay;
export let driverDisplayBtn;
export let driverPercentBtn;
export let assignScanBtn;
export let logoutBtn;

// ======= Driver info setup =======
addDriver("a","Guy 1","123 456 8790",20);
addDriver("b","Guy 2","123 456 8790",30);

const API_URL = window.location.hostname === "localhost" 
  ? "http://localhost:10000" 
  : "https://freight-manager.onrender.com";

function addDriver(username,name, number,pay_percentage){
  driverInfo.push({username,name,number,pay_percentage});
}

function populateDriverInfo(driver){
  const d = driverInfo.find(e => e.username === driver);
  currentDriver = d.username;
  console.log(currentDriver);
  document.getElementById("driver_name").textContent = d.name;
  document.getElementById("driver_phone").textContent = d.number;
  document.getElementById("driver_pay_percent").textContent = d.pay_percentage;
}

function populateFromScan(scan){

  Object.entries(scan).forEach(([key, value]) => {
    const item = document.getElementById(key);
    if(item && key!= "delivery"){ 
      item.textContent = value;
      if ( key === "total_weight" ){
        // sometimes reads lbs as 3 additional digits. 
        // so take first 5 decimal places
        item.textContent = value.slice(0,5);
      }
      if( key === "total_payment" ){
        document.getElementById("driver_pay").textContent = d.pay_percentage*parseFloat(value);
      }
    }
    });
    
}


if(isAdmin(currentUser)){
  initAdmin();
}

// ======= DOM wrapper =======
export function initAdmin(){
document.addEventListener("DOMContentLoaded", () => {
  
  // --- Assign DOM ---
  usernameDisplay   = document.getElementById("usernameDisplay");
  pdfInput          = document.getElementById("pdfInput");
  scanBtn           = document.getElementById("scanBtn");
  scanDropdown      = document.getElementById("scanDropdown");
  pdfLink           = document.getElementById("pdfLink");
  scanBlock         = document.getElementById("scanDetails");
  loadingText       = document.getElementById("scanLoadingText");
  pickupBox         = document.getElementById("pickup_box");
  fuelBox           = document.getElementById("fuel_stop_box");
  fuelAddr          = document.getElementById("fuel_stop_addr");
  fuelTime          = document.getElementById("fuel_stop_time");
  addFuelBtn        = document.getElementById("fuel_stop_add");
  deliveryBox       = document.getElementById("delivery_box");
  driverDropdown    = document.getElementById("driver-select");
  scanningArea      = document.getElementById("scan-functionality");
  driverDisplay     = document.getElementById("driver-view");
  driverDisplayBtn  = document.getElementById("show-driver-page");
  driverPercentBtn  = document.getElementById("driver_percentage_button");
  assignScanBtn     = document.getElementById("assign-scan");
  logoutBtn         = document.getElementById("logout");

  // --- Guards for event listeners ---
  driverDropdown?.addEventListener("change", updateDriverSelection);
  scanBtn?.addEventListener("click", scanPdf);
  scanDropdown?.addEventListener("change", selectScan);
  assignScanBtn?.addEventListener("click", assignScan);
  addFuelBtn?.addEventListener("submit",addFuelHtml);
  driverDisplayBtn?.addEventListener("click", showDriverPage);
  logoutBtn?.addEventListener("click", logout);
  

  // --- Verify login ---
  if (!currentUser) {
    alert("No user logged in!");
    window.location.href = "index.html";
  } else {
    currentDriver = currentUser;
  }

  // --- Initialize page ---
  usernameDisplay.textContent = currentUser;
  loadDrivers();

});
}

//todo:
/*
refernce the id spans
calculate driver pay
*/

// truck
// load 
// shipment/pickup/manifest + scanned dtrip info


// for admin page
function assignScan(){

  const scanId = scanDropdown.value;
  assignedScans[currentDriver] =scanId;

 // Store in localStorage
  localStorage.setItem("assignedScans", JSON.stringify(assignedScans));
}

function createGoogleMapsRequest(address){
  let req_str = "https://www.google.com/maps/dir/?api=1&destination=";
  const encoded = encodeURIComponent(address);
  return req_str += encoded;
}

function addNavHtml(elem,box,index,type){

  const emojis = {"Delivery": "📦", "Pickup":"🚚", "Fuel":"⛽"}
  const section = document.createElement("section");
  const nav_string = createGoogleMapsRequest(elem.locations);
  section.innerHTML = `
  <h2>${type} #${index}</h2>
  <p><strong>${elem.name}</strong></p>
  <p>${elem.locations}</p>
  <p><strong>Date / Time:</strong> ${elem.windows}</p>
  <p><strong>Special Instructions: </strong> ${elem.checkin_instructions}</p>
  <a class="nav-btn"
     href="${nav_string}"
     target="_blank">
     ${emojis[type]} Navigate to ${type}
  </a>

  `;
  box.append(section);
}

function addFuelHtml(){
   e.preventDefault(); // 🚨 stops page reload
  console.log("Fuel Form Submitted.")
  const address = fuelAddr.value;
  const time = fuelTime.value;
  const emoji = "⛽";
  const section = document.createElement("section");
  const nav_string = createGoogleMapsRequest(address);
  section.innerHTML = `
  <h2>$Fuel Stop </h2>
  <p>${address}</p>
  <p><strong>Date / Time:</strong>${time}</p>
  
  <a class="nav-btn"
     href="${nav_string}"
     target="_blank">
     ${emoji} Navigate to Fuel Stop
  </a>

  `;
  fuelBox.append(section);
}

function addAllPickupsHtml(pickups){
  pickups.forEach((pickup, i) => {
    addNavHtml(pickup,pickupBox,i+1,"Pickup");
  });
}

function addAllDeliveriesHtml(deliveries){
  deliveries.forEach((delivery, i) => {
    addNavHtml(delivery,deliveryBox,i+1,"Delivery");
  });
}



//load driver list
async function loadDrivers () {
  const users = getLogins();
  drivers = users.map(user => user.username);

  drivers.forEach(driver => {
    if(!isAdmin(driver)){
    const option = document.createElement("option");
    option.value = driver;
    option.text = driver;
    driverDropdown.appendChild(option);}
  });

}

// update driver
async function updateDriverSelection(){
  
  currentDriver = driverDropdown.value;
  console.log(currentDriver);
  populateDriverInfo(currentDriver);
  scanningArea.style = "display: block;";
  loadScans();

}

// Upload a new PDF
 async function scanPdf () {
  if (!pdfInput.files.length) return alert("Select a PDF first");
  
  const formData = new FormData();
  formData.append("file", pdfInput.files[0]);
  formData.append("userId", currentDriver);

  loadingText.textContent = "Processing...";
  loadingText.display = 'block';

  const res = await fetch(`${API_URL}/ocr`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) return alert("Upload failed");
  const newScan = await res.json();
  console.log("Uploaded scan:", newScan);

  loadingText.textContent = " Scan complete! Select a scan from the dropdown to view."
  
  // Refresh the dropdown
  loadScans();
}

// Load previous scans on page load
async function loadScans() {
  console.log(currentDriver);
  const res = await fetch(`${API_URL}/scans?userId=${currentDriver}`);
  const scans = await res.json();

  scanDropdown.innerHTML = `<option value="">-- Select a scan --</option>`;

  scans.forEach(scan => {
    const option = document.createElement("option");
    option.value = scan.id;
    // Human-friendly summary: date + total entities or pdf filename
    option.text = `${new Date(scan.createdAt).toLocaleString()} - ${scan.pdf.split("/").pop()}`;
    scanDropdown.appendChild(option);
  });
}

async function selectScan (){
  // clear existing navigation divs
  pickupBox.replaceChildren();
  deliveryBox.replaceChildren();

  const scanId = scanDropdown.value;
  if (!scanId) {
  scanBlock.display = 'none';
  return;}

  const res = await fetch(`${API_URL}/scans?userId=${currentDriver}`);
  const scans = await res.json();
  const scan = scans.find(s => s.id === scanId);
  if (!scan) return;

  pdfLink.href = scan.pdf;

  scanBlock.style = "display: block;";
  populateFromScan(scan.formatted);
  addAllPickupsHtml(scan.formatted["pickups"]);
  addAllDeliveriesHtml(scan.formatted["deliveries"]);

}

// show driver view of the ratecon
async function showDriverPage() {
    driverDisplay.style = "display: block;";
}


// logout
function logout () {
    sessionStorage.removeItem("currentUser");
    window.location.href = "index.html";
}




