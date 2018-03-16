$(function() {
	var isDragOver = false;
	
	var files = [];
	var currentFileName;

	var uploadQueue = [];
	var currentQueueIndex = 0;
	var isUploading = false;
	var getProgressReties = 0;
	
	var html5Uploader = null;
	var items = {};
    
	function deleteBook() {
		if (!confirm(STRINGS.CONFIRM_DELETE_BOOK)) {
			return;
		}
		var ssid = $(this).attr("ssid");
		if(ssid==null || ssid=="" || ssid=="undefind"){
			alert("无法删除，请刷新图书列表后再尝试删除");
			return;
		}
		var deleteUrl = CONFIG.BOOK_DELETE + "?ssid=" + ssid;
		var fileInfoContainer = $(this).parent().parent();
		fileInfoContainer.css({ 'color':'#fff', 'background-color': '#cb4638' });
		fileInfoContainer.find('.down').removeClass('down');
		fileInfoContainer.find('.delete').removeClass('delete').unbind();
		$.post(deleteUrl, function() {
			setTimeout(function() { 
				fileInfoContainer.slideUp('fast', function() {
					fileInfoContainer.remove();
				});
			}, 300);
		});
	}
	
	function loadFileList() {
		var now = new Date();
		var url = CONFIG.BOOK_LIST+"?time="+now.getTime();
		$.getJSON(url , function(data) {
			files = data;
			fillFilesContainer();
			$(".delete").click(deleteBook);
		});
	}

	function fillFilesContainer() {
	
		for (var i = 0; i < files.length;i ++) {
			var fileInfo = files[i];
			var row = $('<tr>');
			row.append('<td width="500" filename="' + escape(fileInfo.bookName) + '" ssid="'+fileInfo.ssid+'">'+fileInfo.bookName+'<span class="cor"></span></td>');
			row.append('<td width="120">' + fileInfo.fileSize +'</td>');
			row.append('<td width="150">——</td>');
			row.append('<td><a class="icons down" href="/'+CONFIG.BOOK_DOWN+'?ssid='+fileInfo.ssid+'"></a><a class="icons delete" ssid="'+fileInfo.ssid+'"></a></td>');
			$("#file_list").prepend(row);
		}
	}

	function getUploadProgress() {
		var time = new Date().getTime();
		var url = 'progress/' + encodeURI(currentFileName) + '?' + time;
		$.getJSON(url, function(data) {
			if (!data) {
				getProgressReties ++;
				if (getProgressReties < 5) {
					setTimeout(getUploadProgress, 500);
					return;
				} else {
					alert(STRINGS.USE_ONE_BROWSER);
				}
			}
			
			getProgressReties = 0;
			var ele = $("#right .file [filename='" + escape(data.fileName) + "']")
			var eleSize = ele.next();
			eleSize.text(data.size);
			var elePrecent = eleSize.next()
			elePrecent.text(Math.round(data.progress * 100) + "%");
			var eleProgress = ele.prev();
			eleProgress.animate({ width:Math.round(483 * data.progress) }, 280);
		
			if (data.progress < 1) {
				setTimeout(getUploadProgress, 300);
			} else {
				elePrecent.text('');
			}
		});
	}

	function startAjaxUpload() {
		if (isUploading || currentQueueIndex >= uploadQueue.length) {
			return;
		}
		
		isUploading = true;
		var eleFile = $(uploadQueue[currentQueueIndex]);
		var eleFileId = eleFile.attr('id');
		var fileName = eleFile.val();
		var arr = fileName.split("\\");
		fileName = arr[arr.length - 1];
		
		currentQueueIndex ++;
		
		var row = $("#file_list td[filename='" + escape(fileName) + "']").parent();
		
		$.ajaxFileUpload({
			url:CONFIG.BOOK_UPLOAD,
			secureuri:false,
			fileElementId:eleFileId,
			dataType: 'text',
			success: function (data, status) {
				if(data){
					var re = eval("(" + data.substring(data.indexOf("{"),data.indexOf("}")) + "})");
					var row = $("#file_list td[filename='" + escape(fileName) + "']").parent();
					if(re.result==1){
						var ele = $("#file_list td[filename='" + escape(fileName) + "']");
						var elePrecent = ele.next().next();
						elePrecent.text("上传完成");
						row.find('.delet').parent().remove();
						row.append('<td><a class="icons down" href="'+CONFIG.BOOK_DOWN+"?ssid="+re.ssid+'"></a><a class="icons delete" ssid="'+re.ssid+'"></a></td>');
						row.find('.delete').click(deleteBook);
					}else{
						row.remove();
						alert(re.errorMsg);
					}
				}else{
					row.remove();
					alert(re.errorMsg);
				}
				
			
				
				isUploading = false;
				
				startAjaxUpload();
			},
			error: function (data, status, e) {
				isUploading = false;
				alert(STRINGS.UPLOAD_FAILED);
				row.remove();
				startAjaxUpload();
			}
		});
	
		currentFileName = fileName;
		var ele = $("#file_list td[filename='" + escape(fileName) + "']");
		var elePrecent = ele.next().next();
		elePrecent.text("上传中...");
		//setTimeout(getUploadProgress, 300);
	}
	
	function checkFileName(fileName) {
		if (!fileName || !fileName.toLowerCase().match('(epub|txt|pdf|pdz|pdzx)$')) {
			return STRINGS.UNSUPPORTED_FILE_TYPE;
		}
		
		var arr = fileName.split("\\");
		fileName = arr[arr.length - 1];
		
		var hasFile = false;
		var existFile = $("#right .file [filename='" + escape(fileName) + "']");
		if (existFile.length > 0) {
            $(this).val("");
			if (existFile.parent().hasClass('progress_wrapper')) {
				return STRINGS.FILE_IN_QUEUE;
			} else {
				return STRINGS.FILE_EXISTS;
			}
		}
		return null;
	}
	
	function uploadFiles(files) {
		var uploader = getHtml5Uploader();
		if (files.length == 1) {
			var msg = checkFileName(files[0].name || files[0].fileName);
			if (msg) {
				alert(msg);
				return;
			}
			uploader.add(files[0]);
			return;
		}
		
		var totalFiles = files.length;
		var actualFiles = 0;
        for (var i = 0; i < files.length; ++i) {
			if (!checkFileName(files[i].name || files[i].fileName)) {
				uploader.add(files[i]);
				actualFiles ++;
			}
        }
		if (totalFiles != actualFiles) {
			var msg = STRINGS.YOU_CHOOSE + totalFiles + STRINGS.CHOSEN_FILE_COUNT + actualFiles + STRINGS.VALID_CHOSEN_FILE_COUNT;
			alert(msg);
		}
	}

	//去重判断
	function checkRepet(fileName){
		var result = true;
		var dels = $('td[width="500"]');
		if(dels){
			var fname = null;
			$.each(dels,function(n,del) {  
				fname = del.getAttribute("filename");
				if(fname && fname==escape(fileName)){
					result=false;
				}
			});
		}
		return result;
	}
	
	function bindAjaxUpload(fileSelector) {
		$(fileSelector).unbind();
		$(fileSelector).change(function() {
		
			//去重判断
			var fileName = $(this).val();
			var arr = fileName.split("\\");
            fileName = arr[arr.length - 1];
			if(fileName){
				if(!checkRepet(fileName)){
					alert(STRINGS.FILE_EXISTS);
					return;
				}
			}
			
			if (this.files) {
				//优先使用HTML5上传方式
				uploadFiles(this.files);
				return;
			}
			
			var msg = checkFileName(fileName);
			if (msg) {
				alert(msg);
				return;
			}
		
			var row = $('<tr>');
			row.append('<td width="500" filename="' + escape(fileName) + '">'+fileName+'<span class="cor" ></span></td>');
			row.append('<td width="120">未知</td>');
			row.append('<td width="150">等待上传...</td>');
			row.append('<td><a class="icons dow"></a><a class="icons delet"></a></td>');
			$("#file_list").prepend(row);
			
			uploadQueue.push(fileSelector);
			$(fileSelector).css({ top: '-9999px', left: '-9999px' });
			$('.file_upload_warper').append('<input class="file_upload" type="file" multiple="multiple" name="newfile" value="" id="newfile_' + uploadQueue.length + '" class="file_upload" />');
			bindAjaxUpload('#newfile_' + uploadQueue.length);
			startAjaxUpload();
		});
		
		if (typeof(Worker) !== "undefined") {
			$(fileSelector)
				.mouseover(function() { $('#upload_button').removeClass('normal').addClass('pressed'); })
				.mouseout(function() { $('#upload_button').removeClass('pressed').addClass('normal'); })
				.mousedown(function() { $('#upload_button').removeClass('normal').addClass('pressed'); })
				.mouseup(function() { $('#upload_button').removeClass('pressed').addClass('normal'); });
		} else {
			$(fileSelector)
				.mouseover(function() { $('#upload_button').css('background-image', 'url("images/select_file1_rollover.jpg")'); })
				.mouseout(function() { $('#upload_button').css('background-image', 'url("images/select_file1.jpg")'); })
				.mousedown(function() { $('#upload_button').css('background-image', 'url("images/select_file1_pressed.jpg")'); })
				.mouseup(function() { $('#upload_button').css('background-image', 'url("images/select_file1.jpg")'); });
		}
	}
	
	function formatFileSize(value) {
	    var multiplyFactor = 0;
	    var tokens = ["bytes","KB","MB","GB","TB"];
    
	    while (value > 1024) {
	        value /= 1024;
	        multiplyFactor++;
	    }
    
	    return value.toFixed(1) + " " + tokens[multiplyFactor];
	}
    
    function cancelUpload() {
        var uploader = getHtml5Uploader();
        var fileName = $(this).attr('filename');
        if (fileName) {
            item = items[fileName];
            if (item) {
				STRINGS.UPLOAD_FAILED = '已取消上传';
                uploader.abort(item);
            }
        }
    }
	
	function getHtml5Uploader() {
		if (!html5Uploader) {
			html5Uploader = new bitcandies.FileUploader({
				url: CONFIG.BOOK_UPLOAD,
				maxconnections: 1,
				fieldname: 'file',
                enqueued: function (item) {
					var fileName = item.getFilename();
                    items[escape(fileName)] = item;
					var size = item.getSize();
					
					var row = $('<tr>');
					row.append('<td width="500" filename="' + escape(fileName) + '">'+fileName+'<span class="cor" ></span></td>');
					row.append('<td width="120">' + formatFileSize(size) +'</td>');
					row.append('<td width="150">等待上传...</td>');
					row.append('<td><a class="icons dow"></a><a class="icons delete" filename="' + escape(fileName) + '"></a></td>');
					$("#file_list").prepend(row);
					row.find('.delete').click(cancelUpload);
                    //$('<div class="column trash_white" title="'+STRINGS.CANCEL+'"></div>')
                    //    .click(cancelUpload)
                     //   .appendTo(row);
					//$("#right .files").prepend(row);
                },
                progress: function (item, loaded, total) {
					var fileName = item.getFilename();
					var progress = loaded / total;
					if(progress>0){
						$("#file_list td[filename='" + escape(fileName) + "'] span").removeClass("cor").addClass("rate");
					}
					var ele = $("#file_list td[filename='" + escape(fileName) + "']");
					var elePrecent = ele.next().next();
					elePrecent.text(Math.round(progress * 100) + "%");
					$("#file_list td[filename='" + escape(fileName) + "'] span").width(Math.round(progress * 100) + "%");
                },
                success: function (item,xhr) {
					var fileName = item.getFilename();
					var row = $("#file_list td[filename='" + escape(fileName) + "']").parent();
                    var re =  $.parseJSON(xhr.responseText);
                    if(re.result==1){
                    	var ele = $("#file_list td[filename='" + escape(fileName) + "']");
						var elePrecent = ele.next().next();
						elePrecent.text("上传成功");
						$("#file_list td[filename='" + escape(fileName) + "'] span").removeClass("rate").addClass("cor");
						row.find('.delete').unbind();
						row.find('.delete').parent().remove();
						row.append('<td><a class="icons down" href="'+CONFIG.BOOK_DOWN+"?ssid="+re.ssid+'"></a><a class="icons delete" ssid="'+re.ssid+'"></a></td>');
						row.find('.delete').click(deleteBook);
                    }else{
                    	row.remove();
                    	alert(re.errorMsg);
                    }
                },
                error: function (item) {
					var fileName = item.getFilename();
					var row = $("#file_list td[filename='" + escape(fileName) + "']").parent();
					row.remove();
					alert(STRINGS.UPLOAD_FAILED);
					STRINGS.UPLOAD_FAILED = STRINGS.UPLOAD_FAILED2;
                },
                aborted: function (item) {
                    var fileName = item.getFilename();
					var row = $("#file_list td[filename='" + escape(fileName) + "']").parent();
					row.remove();
					alert(STRINGS.UPLOAD_FAILED);
					STRINGS.UPLOAD_FAILED = STRINGS.UPLOAD_FAILED2;
                }
			});
		}
		return html5Uploader;
	}
	
    function handleDragOver(evt) {
        evt.stopPropagation();
        evt.preventDefault();
		if (!isDragOver) {
            $(this).removeClass('normal').addClass('active');
			isDragOver = true;
		}
    }
	
    function handleDragLeave(evt) {
        evt.stopPropagation();
        evt.preventDefault();
		
		$(this).removeClass('active').addClass('normal');
		isDragOver = false;
    }
	
    function handleDrop(evt) {
        evt.stopPropagation();
        evt.preventDefault();
		var uploader = getHtml5Uploader();
		
		$(this).removeClass('active').addClass('normal');
		isDragOver = false;
		
		if (evt.dataTransfer && evt.dataTransfer.files) {
			uploadFiles(evt.dataTransfer.files);
		}
    }
	
	function dragUpload() {
        var dropArea = document.getElementById('drag_area');
		if (dropArea && dropArea.addEventListener) {
	        dropArea.addEventListener('dragover', handleDragOver, false);
			dropArea.addEventListener('dragleave', handleDragLeave, false);
	        dropArea.addEventListener('drop', handleDrop, false);
		}
	}
	
	function initPageStrings(){
        var now = new Date();
		var url = CONFIG.CLIENT_NAME+"?time="+now.getTime();
		$.getJSON(url , function(data) {
			if(data.result == 1){
				var client_name = data.clientName;
				$("#client_name").html(client_name);
			}
		});
	}

	$(document).ready(function() {
		
		//fillFilesContainer();
		loadFileList();
		$(window).resize(function() {
			//fillFilesContainer();
		});
		bindAjaxUpload('#newfile_0');
		
		//if (typeof(Worker) !== "undefined") {
			//showHtml5View();
		//} else {
		//	showHtml4View();
		//}
		
		$(document).ajaxError(function(event, request, settings){
			alert(STRINGS.CANNOT_CONNECT_SERVER);
			//$('.progress_wrapper, .progress').css( { 'background':'#f00' });
		});
		initPageStrings();
	});
});