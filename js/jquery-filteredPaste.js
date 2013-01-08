/**
* @author Willem Mulder
* @license CC-BYSA 3.0 Unported
*/

$.filteredPaste = {
	filters : {
		"default" : function(pastedContent, options) {
			var defaultOptions = {
				"tags" : {
					"*" : { "attributes" : ["alt"]},
					"a" : { "attributes" : ["href"] },
					"img" : { "attributes" : ["src"] },
					"link" : { "attributes" : ["href"] }
				}
			}

			options = $.extend(defaultOptions, options);

			// Create DOM node and insert pastedContent
			var domElement = $("<div>").html(pastedContent);

			// remove all attributes of the element, except the attributes that are on the whitelist
			domElement.find("*").each(function(elm,index) {
				var attributes = $.map(this.attributes, function(item) {
					return item.name;
				});
				var $elm = $(this);
				var attributesToKeep = [];
				$.each(options.tags, function(tagName, tag) {
					if (tagName === "*" || $elm.prop("tagName").toLowerCase() === tagName) {
						$.extend(attributesToKeep, tag.attributes);
					}
				});
				console.log($elm.prop("tagName"), attributesToKeep);
				$.each(attributes, function(i, item) {
					if($.inArray(item,attributesToKeep) == -1 ) {
						$elm.removeAttr(item);
					}
				});
			});
			return domElement.html();
		}
	}
};

$(function() {
	$("body").append("<div contenteditable='true' class='filteredPaste_pasteIntoArea' style='position: absolute; width: 1px; height: 1px; overflow: hidden;'></div>");
});

$.fn.filteredPaste = function(elements, options) {

	var defaultOptions = {
		"filters" : ["default"]
	}

	options = $.extend(defaultOptions, options);

	console.log(options);

	$.each(this, function(index, elm) {
		var $elm = $(elm);

		$elm.on("paste", function(event) {
			// Store cursor position / selection
			var savedStartOffset;
			var savedEndOffset;
			var savedStartContainer;
			var savedEndContainer;
			if(window.getSelection) {
				// non IE
		        var currentRange = window.getSelection().getRangeAt(0);
		        savedStartOffset = currentRange.startOffset;
		        savedEndOffset = currentRange.endOffset;
		        savedStartContainer = currentRange.startContainer;
		        savedEndContainer = currentRange.endContainer;
		    } else if(document.selection) { 
		    	// IE
		        var currentRange = document.selection.createRange();
		        savedStartOffset = 1; // TODO
		    }
			
			var $pasteInto = $(".filteredPaste_pasteIntoArea");	    
			$pasteInto.html("").focus();
			setTimeout(function() {
			    // Get pasted content
				var pastedContent = $pasteInto.html();
				// Run filters
				for(index in options.filters) {
					var filterName = options.filters[index];
					var filter = $.filteredPaste.filters[filterName];
					pastedContent = filter(pastedContent);
					console.log("ran filter " + filterName);
				}
				// Restore cursor and insert content
				$elm.focus();
				setTimeout(function() {
			        if (window.getSelection || document.createRange) {
			        	 // non IE
			            var s = window.getSelection();
			            if (s && s.rangeCount > 0)  {
			                s.removeAllRanges();
		                }
			            // Restore Cursor
			            var newRange = document.createRange();
			            newRange.setStart(savedStartContainer, savedStartOffset);
			            newRange.setEnd(savedEndContainer, savedEndOffset);
			            s.addRange(newRange);
			            // Insert filtered content. execCommand() delivers native undo-support
			            document.execCommand("insertHTML", false, pastedContent);	
			        } else if (document.selection) {
		            	// IE
		            	// TODO
		                savedRange.select();
		            }
			    }, 10); // End Restore of 
			}, 10); // End insert
		}); // End onpaste event
	}); // End each element
}