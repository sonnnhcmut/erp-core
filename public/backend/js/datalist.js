// Filter a datalist
function globalFilterAction(list) {
    var url = list.attr('data-url');
    var id = list.attr('data-id');
    var sort_by = list.attr('sort-by');
    var sort_direction = list.attr('sort-direction');

    // Filters
    var filters = getValuesFromCheckableList(list.find('.datalist-filters li'));

    // Columns
    var columns = getValuesFromCheckableList(list.find('.datalist-columns-select li'));

    // Keywords
    if(typeof(keywords[id]) == 'undefined') {
        keywords[id] = [];
    }
    keywords[id].forEach(function(entry) {
        addItemToListSearch(list, entry, entry[0].label);
    });

    // Selects
    if(typeof(selects[id]) == 'undefined') {
        selects[id] = [];
    }
    selects[id].forEach(function(entry) {
        addItemToListSearch(list, entry, entry[0].label);
    });
    filters = filters.concat(selects[id]);

    // More global filter
    var global_filter = {};
    if ($('.global-filter').length) {
        arr = $('.global-filter').serializeArray();
        for (var i = 0; i < arr.length; i++){
          global_filter[arr[i]['name']] = arr[i]['value'];
        }
    }

    // ajax update custom sort
	$.ajax({
        url: '',
        method: 'GET',
        data: {
            'authenticity_token': AUTH_TOKEN,
            'filters': filters,
            'columns': columns,
            'keywords': keywords[id],
            'sort_by': sort_by,
            'sort_direction': sort_direction,
            'global_filter': global_filter
        },
    }).done(function( html ) {
        var win = window.open();
        win.document.write(html);
    });
}

// Remove from selects
function removeFromSelects(list, id) {
    var new_selects = [];
    var listid = list.attr('data-id');

    // check if entry exist keyword groups
    selects[listid].forEach(function(entry) {
        var exist = false;

        // check if entry exist keyword group entries
        entry.forEach(function(entry2) {
            if(entry2.id == id) {
                exist = true;
            }
        });

        if(!exist) {
            new_selects.push(entry);
        }
    });
    selects[listid] = new_selects;
}

// Add chose search entry to selects
function addToSelects(list, item) {
    var id = list.attr('data-id');

    // get item values
    var name = item.attr("name");
    var text = item.html();
    var value = item.attr('value');
    var label = item.parents('li').find('.keyword').attr('text');

    var new_item = {id: guid(), name: name, text: text, value: value, label: label};

    // Check if exists
    var exist = false;
    selects[id].forEach(function(entry, index, arrays) {
        entry.forEach(function(entry2) {
            if(entry2.name == new_item.name) {
                exist = true;
                arrays[index] = [new_item];
            }
        });
    });

    // add to keywords
    if(!exist) {
        selects[id].push([new_item]);
    }

    console.log(selects[id]);

    datalistFilter(list);

    // clear current input
    list.find(".datalist-search-input").val("");
    list.find(".datalist-search-helper").hide();
}

// load keyword select list
function loadKeywordSelectList(container) {
    var list = container.parents('.datalist');
    var id = list.attr('data-id');
    var url = container.attr('data-url');
    var keyword = list.find(".datalist-search-input").val();
    var name = container.attr('name');

    container.html('');

    // ajax update custom sort
	if(keywords_xhrs[url+name] && keywords_xhrs[url+name].readyState != 4){
		keywords_xhrs[url+name].abort();
	}
    keywords_xhrs[url+name] = $.ajax({
        url: url,
        data: {
            keyword: keyword
        }
    }).done(function( result ) {
        // check if entry exist keyword groups
        result.forEach(function(entry) {
            var html = '<li><a href="javascript:;" class="keyword-select-item" name="' + name + '" value="' + entry.value + '">' +
                entry.text +
                '</a></li>';
            container.append(html);
        });

        // empty
        if(!result.length) {
            var html = '<li><a href="javascript:;">' +
                LANG_NO_RECORD_FOUND +
                '</a></li>';
            container.append(html);
            container.parents('li').addClass('no-record');
        } else {
            container.parents('li').removeClass('no-record');
        }
    });
}

// datalist link proccess
function listActionProccess(link) {
    var method = link.attr('data-method');
    if(typeof(method) === 'undefined' || method.trim() === '') {
        method = 'GET';
    }

    var url = link.attr("href");
    var list = link.parents(".datalist");
    var link_item = link;
    var ids = getDataListCheckedIds(list);

    if(!ids.length) {
        swal({
            title: LANG_PLEASE_SELECT_AT_LEAST_ONE_ROW,
            text: '',
            type: 'error',
            allowOutsideClick: true,
            confirmButtonText: "OK"
        });
        return;
    }

    $.ajax({
        url: url,
        method: method,
        data: {
            'authenticity_token': AUTH_TOKEN,
            'format': 'json',
            'ids': ids
        }
    }).done(function( result ) {
        swal({
            title: result.message,
            text: '',
            type: result.type,
            allowOutsideClick: true,
            confirmButtonText: "OK"
        });

        // find outer datalist if exists
        if(link_item.parents('.datalist').length) {
            datalistFilter(link_item.parents('.datalist'));
        }
    });
}

// action
function getDataListCheckedIds(list) {
    var ids = list.find("td input[name='ids[]']:checked").map(
        function () { return this.value; }
    ).get();

    return ids;
}

// checkDatalistCheckAllState
function checkDatalistCheckAllState(list) {
    var check_all_box = list.find('.datalist-checkbox-all');
    var ids = getDataListCheckedIds(list);
    var action_button = list.find('.datalist-list-action');
    var row_count = list.find("td input[name='ids[]']").length;

    // check length
    if(ids.length) {
        check_all_box.prop('checked', true);
        action_button.css('display', 'inline-block');
    } else {
        check_all_box.prop('checked', false);
        action_button.hide();
    }

    // half check class
    if(ids.length < row_count) {
        check_all_box.parent().find('span').addClass('check-half');
    } else {
        check_all_box.parent().find('span').removeClass('check-half');
    }
}

// Remove from keywords
function removeFromKeywords(list, id) {
    var new_keywords = [];
    var listid = list.attr('data-id');

    // check if entry exist keyword groups
    keywords[listid].forEach(function(entry) {
        var exist = false;

        // check if entry exist keyword group entries
        entry.forEach(function(entry2) {
            if(entry2.id == id) {
                exist = true;
            }
        });

        if(!exist) {
            new_keywords.push(entry);
        }
    });
    keywords[listid] = new_keywords;
}

// removeDatalistSearchItem
function removeDatalistSearchItem(list, id) {
    var item = $('[data-id="' + id + '"]');

    // if is checkable list
    if(item.length) {
        checkCheckableItem($('[data-id="' + id + '"]'));
    } else {
        // if it is keyword
        removeFromKeywords(list, id);

        // if it is selected item
        removeFromSelects(list, id);
    }
}

// Add to keywords
function addToKeywords(list, item) {
    var id = list.attr('data-id');

    if(typeof(item) == 'undefined') {
        // get default keyword
        item = list.find(".datalist-search-helper ul li").eq(0).find("a .keyword");
    }

    // get item values
    var name = item.attr("name");
    var text = item.attr("text");
    var value = item.html();

    item = {id: guid(), name: name, text: value, value: value, label: text};

    // Check if exists
    var exist = false;
    keywords[id].forEach(function(entry) {
        var inserted = false;
        entry.forEach(function(entry2) {
            if(entry2.name == item.name) {
                exist = true;
                if(entry2.text == item.text) {
                    inserted = true;
                }
            } else {
                inserted = true;
            }
        });

        if(!inserted) {
            entry.push(item);
        }
    });

    // add to keywords
    if(!exist) {
        keywords[id].push([item]);
    }

    // console.log(keywords[id]);
    datalistFilter(list);

    // clear current input
    list.find(".datalist-search-input").val("");
    list.find(".datalist-search-helper").hide();
}

// toggleDatalistSearchHelper
function toggleDatalistSearchHelper(list) {
    var keyword = list.find(".datalist-search-input").val();
    var helper = list.find(".datalist-search-helper");

    // Toggle helper box
    if(keyword.trim() !== '') {
        helper.show();
    } else {
        helper.hide();
    }

    // Update keyword field
    helper.find('.keyword').html(keyword);
}

// check checkable li item
function checkCheckableItem(li) {
    if(li.hasClass('checked')) {
        li.removeClass('checked');
    } else {
        li.addClass('checked');
    }
}

function getUrlParameter(url, sParam) {
    var sPageURL = decodeURIComponent(url.split('?')[1]),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
}

// Add item to list search
function addItemToListSearch(list, ors, label) {
    var box = list.find('.list-search-items');
    var html = '';
    var texts = [];
    var ids = [];

    ors.forEach(function(entry) {
        texts.push(entry.text);
        ids.push(entry.id);

        // overide label
        if(entry.label) {
            label = entry.label;
        }
    });

    html = '<div class="btn-group btn-group-solid list-search-item" data-ids="' + ids.join(',') + '">' +
        '<button type="button" class="btn green-meadow">' +
            label +
        '</button>' +
        '<button type="button" class="btn grey">' +
            texts.join(' <span class="or-cond">' + LANG_OR +'</span> ') +
        '</button>' +
        '<button type="button" class="btn grey cancel-button"><i class="fa fa-close"></i></button>' +
    '</div>';

    box.append(html);
}

// Add filters to list search items
function addItemsToListSearch(list, items, label) {
    items.forEach(function(ors) {
        addItemToListSearch(list, ors, label);
    });
}

// Get values from checkable list items
function getValuesFromCheckableList(items) {
    var conditions = [];
    var ors = [];
    items.each(function() {
        var id = $(this).attr('data-id');
        var name = $(this).attr('name');
        var value = $(this).attr('value');
        var text = $(this).find('a').html();
        var checked = $(this).hasClass('checked');

        // Push conditions to ors array
        if(typeof(name) !== 'undefined' && name.trim() !== '') {
            if(checked) {
                if(typeof(text) == 'undefined') {
                    text = '';
                }
                ors.push({'id': id, 'name': name, 'value': value, 'text': text.trim()});
            }
        }

        // Check if end of ors
        if($(this).hasClass('divider') && ors.length) {
            conditions.push(ors);
            ors = [];
        }
    });
    // Add last one
    if(ors.length) {
        conditions.push(ors);
    }

    return conditions;
}

// Filter all datalists in current page
function datalistFilterAll() {
    $('.datalist').each(function() {
        datalistFilter($(this));
    });
}

// Update datalist sort layout
function updateDatalistSortLayout(list) {
    var sort_by = list.attr('sort-by');
    var sort_direction = list.attr('sort-direction');
    var th = list.find('th.sortable[sort-by="' + sort_by + '"]');

    th.addClass('current');
    th.attr('sort-direction', sort_direction);
}

// Filter a datalist
function datalistFilter(list, page) {
    var url = list.attr('data-url');
    var id = list.attr('data-id');
    var sort_by = list.attr('sort-by');
    var sort_direction = list.attr('sort-direction');

    // check page
    if(typeof(page) == 'undefined') {
        page = 1;
    }

    // save current page
    list.attr('data-page', page);

    // Clear list search
    list.find('.list-search-items').html('');

    // Filters
    var filters = getValuesFromCheckableList(list.find('.datalist-filters li'));
    addItemsToListSearch(list, filters, '<i class="fa fa-filter"></i>');

    // Columns
    var columns = getValuesFromCheckableList(list.find('.datalist-columns-select li'));

    // Keywords
    if(typeof(keywords[id]) == 'undefined') {
        keywords[id] = [];
    }
    keywords[id].forEach(function(entry) {
        addItemToListSearch(list, entry, entry[0].label);
    });

    // Selects
    if(typeof(selects[id]) == 'undefined') {
        selects[id] = [];
    }
    selects[id].forEach(function(entry) {
        addItemToListSearch(list, entry, entry[0].label);
    });
    filters = filters.concat(selects[id]);

    // More global filter
    var global_filter = {};
    if ($('.global-filter').length) {
        arr = $('.global-filter').serializeArray();
        for (var i = 0; i < arr.length; i++){
            var name = arr[i]['name'];
            if (name.indexOf('[]') !== -1) {
                name = name.substr(0,name.length-2)
            }
            if (global_filter[name]) {
                if (global_filter[name].constructor !== Array) {
                    global_filter[name] = [global_filter[name]];
                }
                global_filter[name].push(arr[i]['value']);
            } else {
                global_filter[name] = arr[i]['value'];
            }
        }
    }

    list.find(".datalist-container").addClass('loading');

    // ajax update custom sort
	if(datalists[id] && datalists[id].readyState != 4){
		datalists[id].abort();
	}
    datalists[id] = $.ajax({
        url: url,
        method: 'POST',
        data: {
            'authenticity_token': AUTH_TOKEN,
            'filters': filters,
            'columns': columns,
            'keywords': keywords[id],
            'page': page,
            'sort_by': sort_by,
            'sort_direction': sort_direction,
            'global_filter': global_filter
        },
    }).done(function( html ) {
        list.find(".datalist-container" ).html( html );

        list.find(".datalist-container").removeClass('loading');

        // update list sort layout
        updateDatalistSortLayout(list);

        // hide actions button
        checkDatalistCheckAllState(list);

        // Tooltip
        jsForAjaxContent(list);
    });
}

var datalists = {};
var keywords_xhrs = {};
var keywords = {};
var selects = {};
// Main js execute when loaded page
$(document).ready(function() {
    // Filter all datalists in first load
    datalistFilterAll();

    // Filters group link click
    $(document).on('click', '.btn-group-checkable .dropdown-menu>li>a', function(e) {
        e.preventDefault();
        e.stopPropagation();

        var li = $(this).parents('li');

        checkCheckableItem(li);
    });

    // Filter when click checkable items
    $(document).on('click', '.btn-group-checkable .dropdown-menu>li>a', function() {
        var list = $(this).parents('.datalist');
        datalistFilter(list);
    });

    // Change page
    $(document).on("click", ".datalist .pagination a", function(e) {
        var url = $(this).attr("href");
        var list = $(this).parents('.datalist');
        var page = getUrlParameter(url, 'page');

        datalistFilter(list, page);

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    });

    // Remove item from search list
    $(document).on("click", ".list-search-item .cancel-button", function() {
        var item = $(this).parents('.list-search-item');
        var ids = item.attr('data-ids');
        var list = $(this).parents('.datalist');

        ids.split(",").forEach(function(id) {
            // checkCheckableItem($('[data-id="' + id + '"]'));
            removeDatalistSearchItem(list, id);
        });

        datalistFilter(list);
    });

    // Datalist search input
    $(document).on("focus", ".datalist-search-input", function() {
        var list = $(this).parents('.datalist');
        toggleDatalistSearchHelper(list);
    });

    // Datalist search input
    $(document).on("keyup", ".datalist-search-input", function(e) {
        var list = $(this).parents('.datalist');
        toggleDatalistSearchHelper(list);

        // show keyword-select if exits
        list.find('.keyword-select').each(function () {
            loadKeywordSelectList($(this));
        });

        var code = e.which;
        if(code==13) e.preventDefault();
        if(code==13){
            // add keyword to list
            addToKeywords(list);
        }

    });

    // Datalist search helper click
    $(document).on("click", ".datalist-search-helper ul li a.keyword-line", function() {
        var list = $(this).parents('.datalist');
        var keyword = $(this).find(".keyword");

        addToKeywords(list, keyword);
    });

    // Hide datalist helper
    $(document).mouseup(function (e)
    {
        var container = $(".list-filters-search");
        var helper = $(".datalist-search-helper");

        // if the target of the click isn't the container...
        if (!container.is(e.target) && container.has(e.target).length === 0) // ... nor a descendant of the container
        {
            helper.hide();
        }
    });

    // Check all list click
    $(document).on('click', '.datalist-checkbox-all', function() {
        var list = $(this).parents('.datalist');
        var item = $(this);
        var checked = item.is(':checked');
        var action_button = list.find('.datalist-list-action');

        // check all
        if(checked) {
            list.find('.datalist-row-checkbox').prop('checked', true);
        } else {
            list.find('.datalist-row-checkbox').prop('checked', false);
        }

        checkDatalistCheckAllState(list);
    });

    // Check row checkbox
    $(document).on('click', '.datalist-row-checkbox', function() {
        var list = $(this).parents('.datalist');

        checkDatalistCheckAllState(list);
    });

    // List action
    // Datalist action link with message return
    $(document).on('click', '.datalist-list-action ul li a', function(e) {
        e.preventDefault();

        listActionProccess($(this));
    });

    // Datalist action link with message return
    $(document).on('click', '.datalist-search-helper ul li .keyword-select-pointer', function() {
        var select = $(this).parents('li').find('ul');
        select.toggle();

        if(select.is(':visible')) {
            $(this).addClass('open');
        } else {
            $(this).removeClass('open');
        }
    });

    // Sort head click event
    $(document).on('click', '.datalist th.sortable', function() {
        var list = $(this).parents('.datalist');
        var is_current = $(this).hasClass('current');
        var sort_direction = $(this).attr('sort-direction');

        if(typeof(sort_direction) === 'undefined' || sort_direction.trim() === '') {
            sort_direction = 'asc';
        }

        if(is_current) {
            if (sort_direction == 'asc') {
                sort_direction = 'desc';
            } else {
                sort_direction = 'asc';
            }
            list.attr('sort-direction', sort_direction);
            $(this).attr('sort-direction', sort_direction);
        } else {
            list.attr('sort-by', $(this).attr('sort-by'));
            list.attr('sort-direction', sort_direction);
        }

        datalistFilter(list);
    });

    // Datalist search entry select
    $(document).on("click", ".datalist-search-helper ul li a.keyword-select-item", function() {
        var list = $(this).parents('.datalist');
        var item = $(this);

        addToSelects(list, item);
    });

    // Datalist search entry select
    $(document).on("change", ".global-filter input, .global-filter select", function() {
        datalistFilterAll();
    });
});
