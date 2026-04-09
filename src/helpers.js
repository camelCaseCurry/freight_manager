
const admins = ["admin","ADMIN","baby","0","x","y"];

export function isAdmin(username){
  return admins.some(e=> e === username );
}

export function getLogins() {
  const raw = localStorage.getItem("loginData");
  return raw ? JSON.parse(raw) : [];
}

function addEntryToDict(entry,dict){
  dict[entry.type] =  entry.mentionText;
}


function propertiesToDict(properties){
  let dict = {};
  for (const entry of properties){
    addEntryToDict(entry,dict);
  }
  return dict;
}


export function scanOrganizer(entries){
  let pickups = [];
  let deliveries = [];
  let res = {};

  for (const entry of entries){
    switch (entry.type){

      case "delivery":
        deliveries.push(propertiesToDict(entry.properties));
        break;

      case "pickup":
        pickups.push(propertiesToDict(entry.properties));
        break;

      default:
        addEntryToDict(entry,res);
        };
    }

  res["deliveries"]=deliveries;
  res["pickups"]=pickups;

  return res;
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
  <p><strong>Date / Time:</strong>${elem.windows})</p>
  
  <a class="nav-btn"
     href="${nav_string}"
     target="_blank">
     ${emojis[type]} Navigate to ${type}
  </a>

  `;
  box.append(section);
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

  /**
   *   <h2>FUEL STOP</h2>
  </p>
  <p>40 Frederick Rd, Thurmont, MD
US-15</p>

  <a class="nav-btn"
     href="https://www.google.com/maps/dir/?api=1&destination=4870%20York%20Rd%20New%20Oxford%20PA%2017350"
     target="_blank">
     🚚 Navigate to Fuel Stop
  </a>



  <p><strong>Date / Time:</strong> 01/06/2026 | 07:00 (Apt)</p>
  <p class="small"><strong>Appointment #:</strong> 51284701</p>
  <p class="small"><strong>Delivery #:</strong> 162436</p>
   */