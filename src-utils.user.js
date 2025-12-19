// ==UserScript==
// @name         Source Utils
// @namespace    blurymind
// @version      2025-12-10
// @description  copies to clipboard all loaded video and image src links
// @author       blurymind
// @match        https://civitai.com/*
// @include      https://civitai.com/*
// @include      https://*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=civitai.com
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @grant    GM_setClipboard
// ==/UserScript==

class Toast {
  constructor(message,color,time){
    this.message = message;
    this.color = color;
    this.time = time;
    this.element = null;
    var element = document.createElement('div');
    element.className = "toast-notification";
    this.element = element;
    var countElements = document.getElementsByClassName("toast-notification");
      element.style = `
   min-width: 400px;
  height:80px;
  background-color:white;
  border-radius: 10px;
  box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;
  top:0;
  left: 50%;
  margin-top:100px;
  margin-left:0;
  position:fixed;
  z-index:1;
  display:flex;
  flex-direction:row;
  margin-top: ${(countElements.length *100)}px;
  background-color:${this.color};
  z-index: 999999;
      `
    var mess = document.createElement("div");
    mess.className = "message-container";
    mess.style = `
      width:80%;
  padding-top:13px;
  padding-left: 20px;
  font-family:'Roboto';
  color:white;
    `
    mess.textContent = this.message;
    element.appendChild(mess);
    var close = document.createElement("div");
    close.className = "close-notification";
      close.style = `
      width:20%;
      `
    var icon = document.createElement("i");
    icon.className = "lni lni-close";
    icon.style = `
      padding-top:15px;
  padding-left:5px;
  font-weight:900;
  color:white;
  cursor:pointer;
    `
    close.appendChild(icon);
    element.append(close);
    document.body.appendChild(element);
    setTimeout(function() {
      element.remove();
    }, this.time);
    close.addEventListener("click",()=>{
      element.remove();
    })
  }
}
const ToastType = {
  Danger : "#eb3b5a",
  Warning: "#fdcb6e",
  Succes : "#00b894",
}

const copyClip = (text, toast, warn=false) => {
        navigator.clipboard.writeText(text).then(
            () => {
                 new Toast(toast, warn ? ToastType.Warning : ToastType.Succes,2000);
            },
            () => {
                new Toast(`Failed to copy ${text}`,ToastType.Danger,2000);
            },
        );
}
const copyLinks = (type='video/mp4')=>{
    if(type.startsWith('video')){
        const sources = [...document.querySelectorAll('source')]
        .filter(item=>item.type === type)
        .map(item=> item.src);
        console.log({sources})
        copyClip(sources.join(' '), `Copied visible ${type}: ${sources.length} links`, sources.length === 0)
    } else {
        const sources = [...document.querySelectorAll('img')]
        .map(item=> item.src);
        console.log({sources})
        copyClip(sources.join(' '), `Copied visible ${type}: ${sources.length} links`)
    }
    //GM_setClipboard (sources.join(' '));
}

const getRoot = () => document.getElementById('main') ?? document.body.querySelector("main") ?? document.body;
let buttonsVisible = false;
let scrollVisible = true
const buttonClasses = ["copyGlobalLinksSrcUtilsBtn", "copyLocallLinksSrcUtilsBtn"];
const onToggleButtonVisibility = () => {
    //console.log({scrollVisible, buttonsVisible})
    document.querySelectorAll(`.${buttonClasses[0]}`)
     .forEach(button => {
     button.style.display = buttonsVisible && scrollVisible ? "block":"none"
 })
}


var scrollPos = 0;
window.addEventListener('scroll',()=>{
  // detects new state and compares it with the new one
  if ((document.body.getBoundingClientRect()).top > scrollPos){
      scrollVisible = true
  }
    else {
        scrollVisible=false
    }
    onToggleButtonVisibility()
	scrollPos = (document.body.getBoundingClientRect()).top;
});

const createButton = (name='Copy src', type='video', offset = 10) => {
    const button = document.createElement('button');
    button.innerText = name;
    button.id = name;
    button.className = buttonClasses[0]
    button.style = `
    position: fixed;
    z-index: 999;
    background: #000000e0;
    color: yellow;
    padding: 2px;
    border-radius: 3px;
    right: 10px;
    opacity: 0.7;
    display: ${buttonsVisible ? "block":"none"};
    top: ${100 + (offset|| 0)}px;
    `;

    button.addEventListener('click', ()=> {
        copyLinks(type)
    })
    const root = getRoot();
    console.log({root})
    root.appendChild(button);
}

let hoveredElement
const createCopyButton = (imageElement) => {
    if (imageElement.src.startsWith("blob:") || imageElement.src.endsWith(".png")) {
        return;
    }
    const isVideo = imageElement.tagName === "SOURCE"
    imageElement.style.position = "relative"
    imageElement.style.filter = "none"
    const button = document.createElement('button');
    button.innerText = isVideo ? "📋🎞️" : " 📋🖼️ ";
    button.title = imageElement.src;
    button.className = buttonClasses[1]
    button.style = `
    position: absolute;
    z-index: 999;
    background: #000000e0;
    color: yellow;
    border-radius: 3px;
    padding: 5px;
    opacity: 0.7;
    right: 50%;
    top: 50%;
    border: none;
    display: none;
    `;

    button.addEventListener('click', (e)=> {
        e.stopPropagation()
        e.preventDefault()
        copyClip(imageElement.src, `Copied ${imageElement.src}`)
    })
    const attachTo = isVideo ? imageElement.parentElement.parentElement: imageElement.parentElement;
    //const size = imageElement.getBoundingClientRect()
    if(attachTo.querySelector(`.${buttonClasses[1]}`)){
        return;
    }
    attachTo.addEventListener('pointerenter', (e)=>{
        //console.log("enter")
        button.style.display = "block"
        hoveredElement = imageElement.src;
    })
    attachTo.addEventListener('pointerleave', (e)=>{
        //console.log("exit")
        button.style.display = "none"
        hoveredElement = null
    })
    attachTo.style.filter = "none";
    attachTo.appendChild(button);
}

document.addEventListener("keypress", e=> {
    if(hoveredElement) {
        if(e.key === "c") {
            copyClip(hoveredElement, `Copied ${hoveredElement}`)
        }
    }
    if(e.key === "1") {
        buttonsVisible = !buttonsVisible;
        onToggleButtonVisibility()
    }
})

setTimeout(()=>{
    createButton('copy mp4 🎞️', 'video/mp4', 0)
    createButton('copy webm 🎞️', 'video/webm', 30)
    createButton('copy image 🖼️ urls', 'image', 60)
}, 5000)

const callback = (mutationList, observer) => {
  for (const mutation of mutationList) {
    if (mutation.type === "childList") {
      //console.log("A child node has been added or removed.", mutation);
        setTimeout(()=> {
            const foundSources = mutation.target.querySelectorAll("source")
                //console.log({foundSources})
            if(foundSources){
                const sources = Array.from(foundSources)
                //console.log({sources})
                sources.filter(item=>item.type === "video/mp4").forEach(createCopyButton)
            }
        }, 500)

    } else if (mutation.type === "attributes") {
      //console.log(`The ${mutation.attributeName} attribute was modified.`, mutation);
        if(mutation.attributeName === "src"){
            createCopyButton(mutation.target)
        }
    }
  }
};
const observer = new MutationObserver(callback);

setTimeout(()=>{
    const config = { attributes: true, childList: true, subtree: true };
    const root = getRoot();
    observer.observe(root, config);
    document.querySelectorAll("img").forEach(createCopyButton)
    const sources = Array.from(document.querySelectorAll("source"))
    //console.log({sources})
    sources.filter(item=>item.type === "video/mp4").forEach(createCopyButton)
}, 7000)
