function masterLoop() {
	// body...
	var x = setInterval(updaterFunc, 2000);
	function updaterFunc() {
		// body...
		var d = new Date();
		console.log(d.getHours());
		x = null;
	}
}

function calculateMembers(date){
	var hours = date.getHours();
	var minutes = date.getMinutes();
	var seconds = date.getSeconds();

	
}