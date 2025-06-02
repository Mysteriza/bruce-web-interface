const T = {
  master: document.querySelector('#t'),
  fileRow: function () {
    const tmp = document.createElement('template');
    tmp.innerHTML = this.master.content.querySelector('table tr.file-row').outerHTML;
    return tmp.content;
  },
  pathRow: function () {
    const tmp = document.createElement('template');
    tmp.innerHTML = this.master.content.querySelector('table tr.path-row').outerHTML;
    return tmp.content;
  },
}

async function requestGet (url) {
  return new Promise((resolve, reject) => {
    let req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.onload = () => {
      if (req.status >= 200 && req.status < 300) {
        resolve(req.responseText);
      } else {
        reject(new Error(`Request failed with status ${req.status}`));
      }
    };
    req.onerror = () => reject(new Error("Network error"));
    req.send();
  });
}

async function fetchFiles(drive, path) {
  document.querySelector(`.act-browse[data-drive='${drive}']`).classList.add("active");
  let req = await requestGet("/listfiles?fs=" + drive + "&folder=" + path);
  req.split("\n").forEach((line) => {
    let e;
    let [type, name, size] = line.split(":");
    let currentPath = (path.endsWith("/") ? path : path + "/") + name;
    if (type === "pa") {
      e = T.pathRow();
      e.querySelector(".path-row").setAttribute("data-path", name);
    } else if (type === "Fi") {
      e = T.fileRow();
      let extension = name.split('.').pop();
      e.querySelector(".file-row").setAttribute("data-file", currentPath);
      e.querySelector(".col-name").textContent = name;
      e.querySelector(".col-size").textContent = size;
      e.querySelector(".col-action").classList.add("type-" + extension);
    } else if (type === "Fo") {
      e = T.fileRow();
      e.querySelector(".file-row").setAttribute("data-folder", currentPath);
      e.querySelector(".col-name").textContent = name;
      e.querySelector(".col-action").classList.add("type-folder");
    }
    
    document.querySelector("table.explorer tbody").appendChild(e);
  });
}

document.querySelector("table.explorer tbody").addEventListener("click", (e) => {
  console.log(e.target.closest("tr"), e.target.closest(".icon-action"));
});

(async function () {
  await fetchFiles("LittleFS", "/");
})();