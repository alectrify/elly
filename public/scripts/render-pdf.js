// The workerSrc property shall be specified.
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.5.207/pdf.worker.min.js';

// Asynchronous download of PDF
var loadingTask = pdfjsLib.getDocument(`/api/pdf/${id}/${batchNum}`);

function renderPDF(pg) {
    loadingTask.promise
        .then(function (pdf) {
            console.log('PDF loaded');

            // Fetch the first page
            var pageNumber = parseInt(pg);
            pdf.getPage(pageNumber).then(function (page) {
                console.log('Page loaded');

                var scale = 0.75;
                var viewport = page.getViewport({scale: scale});

                // Prepare canvas using PDF page dimensions
                var canvas = document.getElementById('pdfCanvas');
                var context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                // Render PDF page into canvas context
                var renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                var renderTask = page.render(renderContext);
                renderTask.promise.then(function () {
                    console.log('Page rendered');
                });
            });
        }, function (reason) {
            // PDF loading error
            console.error(reason);
        });
}

renderPDF(pageNum);