const urlSections = window.location.pathname.split('/');
let pageNum = urlSections[urlSections.length - 1];
pageNum = (pageNum === 'records') ? 1 : parseInt(pageNum);

const MAX_ROWS = 50;
const RANGE_MIN = (pageNum - 1) * MAX_ROWS;
const RANGE_MAX = pageNum * MAX_ROWS - 1;

$(document).ready(function () {
    $('input[type=date]').css('background-color', '#fff3cd');
    $('input[type=text]').css('background-color', '#fff3cd');
});