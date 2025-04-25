// Get input, video, canvas, and button elements
const reverseButton = document.getElementById("play-reverse");
const input = document.querySelector("input[name='video-Upload']");
const video = document.querySelector("video");
const canvas = document.getElementById("canvas");
const loadingMessage = document.getElementById("loading-message");
const playNormalButton = document.getElementById("play-normal");
const clearButton = document.getElementById("clear-video");
const downloadButton = document.getElementById("download-video");

let frames = []; // Array to hold frames

// Step 1: Load the video when a file is selected
input.addEventListener('change', function () {
    const file = this.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        video.src = url;
        video.load();

        video.style.display = "block";
        video.style.opacity = "1";
        canvas.style.display = "none";
        canvas.style.opacity = "0";
        reverseButton.disabled = true;
        playNormalButton.style.display = "none";
        downloadButton.style.display = "none";
    }
});

// Step 2: Capture frames from the video once loaded
video.addEventListener('loadeddata', function () {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    frames = [];

    let currentTime = 0;

    loadingMessage.style.display = "block";
    reverseButton.disabled = true;
    video.style.display = "none";

    const captureFrame = () => {
        if (currentTime >= video.duration) {
            video.removeEventListener('seeked', captureFrame);
            video.currentTime = 0;
            video.pause();
            loadingMessage.style.display = "none";
            reverseButton.disabled = false;
            return;
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        frames.push(canvas.toDataURL('image/webp'));

        currentTime += 0.1;
        video.currentTime = currentTime;
    };

    video.addEventListener('seeked', captureFrame);
    video.currentTime = currentTime;
});

// Step 3: Play captured frames in reverse when button is clicked
reverseButton.addEventListener('click', function () {
    if (frames.length === 0) {
        alert("The video is not yet ready.");
        return;
    }
    playReverse();
});

playNormalButton.addEventListener('click', function () {
    canvas.style.opacity = "0";
    setTimeout(() => {
        canvas.style.display = "none";
        video.style.display = "block";
        video.style.opacity = "1";
        video.play();
    }, 300);
});

function playReverse() {
    video.style.opacity = "0";
    canvas.style.display = "block";

    setTimeout(() => {
        canvas.style.opacity = "1";
        video.style.display = "none";
    }, 300);

    const context = canvas.getContext('2d');
    let i = frames.length - 1;

    // Set up recording
    const stream = canvas.captureStream();
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const recordedChunks = [];

    recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
            recordedChunks.push(e.data);
        }
    };

    recorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        downloadButton.href = url;
        downloadButton.download = 'reversed-video.webm';
        downloadButton.style.display = "inline-block";
    };

    recorder.start(); // ✅ Start recording

    const play = () => {
        if (i < 0) {
            recorder.stop(); // ✅ Stop recording at the end
            return;
        }

        const img = new Image();
        img.onload = () => {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, 0, 0, canvas.width, canvas.height);
            i--;
            setTimeout(play, 100); // 10 FPS
        };
        img.src = frames[i];
    };

    playNormalButton.style.display = "inline-block";
    play();
}

// Step 4: Clear video and reset
clearButton.addEventListener("click", function () {
    video.pause();
    video.removeAttribute("src");
    video.load();
    canvas.style.display = "none";
    video.style.display = "none";
    frames = [];
    reverseButton.disabled = true;
    loadingMessage.style.display = "none";
    playNormalButton.style.display = "none";
    downloadButton.style.display = "none";
});
