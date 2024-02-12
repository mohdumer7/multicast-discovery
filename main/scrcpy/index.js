const debug = require("debug")("scrcpy");
// const fixPath = require("fix-path");
// fixPath();
const fs = require("fs");
const open = (options) => {
  const args = [];
  const { config, devices } = options;
  const {
    title,
    source,
    record,
    screen,
    fixed,
    control,
    touch,
    render,
    bitRate,
    maxSize,
    maxFps,
    orientation,
    crop,
    window,
    border,
    fullscreen,
    awake,
  } = config;

  let cmd = "scrcpy";
  if (source) {
    const scrcpyPath = `${source}\\scrcpy.exe`;
    if (!fs.existsSync(scrcpyPath)) {
      console.log("error", { type: "unknownScrcpyPathException" });
      return;
    }
    cmd = scrcpyPath;
  }

  args.push("--shortcut-mod=lctrl,rctrl");

  if (title !== "") {
    args.push("--window-title");
    args.push(title);
  }

  args.push("--no-playback");

  if (screen) {
    args.push("--turn-screen-off");
  }
  if (fixed) {
    args.push("--always-on-top");
  }
  if (!border) {
    args.push("--window-borderless");
  }
  if (fullscreen) {
    args.push("--fullscreen");
  }
  if (awake) {
    args.push("--stay-awake");
  } else if (!control) {
    args.push("--no-control");
  }
  if (touch) {
    args.push("--show-touches");
  }
  if (render) {
    args.push("--render-expired-frames");
  }
  if (bitRate !== 8) {
    args.push("--bit-rate");
    args.push(`${bitRate}M`);
  }
  if (maxSize !== 0) {
    args.push("--max-size");
    args.push(`${maxSize}`);
  }
  if (maxFps !== 0) {
    args.push("--max-fps");
    args.push(`${maxFps}`);
  }

  // {
  //   const { x, y, height, width } = crop;
  //   if (height !== 0 || width !== 0) {
  //     args.push("--crop");
  //     args.push(`${height}:${width}:${x}:${y}`);
  //   }
  // }
  {
    const { x, y, height, width } = window;
    if (x !== 0 || y !== 0) {
      args.push("--window-x");
      args.push(`${x}`);
      args.push("--window-y");
      args.push(`${y}`);
    }
    if (height !== 0 || width !== 0) {
      args.push("--window-width");
      args.push(`${width}`);
      args.push("--window-height");
      args.push(`${height}`);
    }
  }

  const args1 = ["--no-audio"];
  devices.forEach(({ id }) => {
    const { spawn } = require("child_process");
    console.log(cmd, [...args, "-s", `${id}`]);
    const scrcpy = spawn(cmd, [...args1, "-s", `${id}`]);

    scrcpy.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    scrcpy.on("error", (err) => {
      console.error(`Error: ${err.message}`);
      // Additional error handling if needed
    });

    scrcpy.on("close", (code) => {
      console.log(`child process closed with code ${code}`);
    });

    scrcpy.on("exit", (code) => {
      console.log(`child process exited with code ${code}`);

      console.log("close", { success: code === 0, id });
      scrcpy.kill();
      exited = true;
    });
  });
};

module.exports = {
  open,
};
