module.expors = plugin;

function plugin() {
  return function (files) {
    for (var file in files) {
      console.log(files[file]);
    }
  }
}