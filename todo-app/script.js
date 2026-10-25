function saveTasks(){

let tasks = [];

document.querySelectorAll("#taskList li").forEach(function(li){

let text = li.querySelector("span").textContent;
let done = li.classList.contains("done");

tasks.push({text:text,done:done});

});

localStorage.setItem("tasks",JSON.stringify(tasks));

}

function updateCounter(){

let tasks = document.querySelectorAll("#taskList li");
let left = 0;

tasks.forEach(function(task){
if(!task.classList.contains("done")){
left++;
}
});

document.getElementById("taskCounter").textContent = left + " tasks left";

}

function createTask(text,done=false){

let li = document.createElement("li");

if(done){
li.classList.add("done");
}

let taskDiv = document.createElement("div");
taskDiv.className="task";

let checkbox = document.createElement("input");
checkbox.type="checkbox";
checkbox.checked=done;

checkbox.onchange=function(){
li.classList.toggle("done");
saveTasks();
updateCounter();
};

let span=document.createElement("span");
span.textContent=text;

taskDiv.appendChild(checkbox);
taskDiv.appendChild(span);

let del=document.createElement("button");
del.textContent="Delete";
del.className="delete";

del.onclick=function(){
li.remove();
saveTasks();
updateCounter();
};

li.appendChild(taskDiv);
li.appendChild(del);

document.getElementById("taskList").appendChild(li);

}

function addTask(){

let input=document.getElementById("taskInput");
let text=input.value.trim();

if(text===""){
return;
}

createTask(text,false);

input.value="";

saveTasks();
updateCounter();

}

document.getElementById("taskInput").addEventListener("keypress",function(e){

if(e.key==="Enter"){
addTask();
}

});

function filterTasks(type){

let tasks=document.querySelectorAll("#taskList li");

tasks.forEach(function(task){

if(type==="all"){
task.style.display="flex";
}

else if(type==="active"){
task.style.display=task.classList.contains("done")?"none":"flex";
}

else if(type==="done"){
task.style.display=task.classList.contains("done")?"flex":"none";
}

});

}

function clearCompleted(){

document.querySelectorAll("#taskList li.done").forEach(function(task){
task.remove();
});

saveTasks();
updateCounter();

}

window.onload=function(){

let saved=localStorage.getItem("tasks");

if(saved){

let tasks=JSON.parse(saved);

tasks.forEach(function(task){
createTask(task.text,task.done);
});

}

updateCounter();

};