$(document).ready(function() {
//////////////////////////////////////////////////////////
////////////////////// Directories ///////////////////////
////////////////////////////////////////////////////////// 
  var directories = {};
  var json = $.ajax({
    dataType: 'json',
    url: url,
    data: '',
    success: function(){
      json = jQuery.parseJSON(json.responseText).paths;

      // to build a directory for developers
      for (var key in json) {
        var verbs = json[key];

        for (var verb in verbs) {
          // create a map object to represent our verb.
          var tag = verbs[verb]['tags'];
          var keywords = verbs[verb]['summary'].replace(/([a-z](?=[A-Z]))/g, '$1 ');
          keywords += ' ' + tag[0].replace(/([a-z](?=[A-Z]))/g, '$1 ');
          var tmp = {
            verb: verb,
            summary: verbs[verb]['summary'],
            // we're searching against keywords, so we can scale our keywords to match other attributes
            keywords: keywords,
            operationId: tag + '_' + verbs[verb]['operationId']
          };

          // decide wheather or not to creat a new array or just push
          if (directories[tag] == undefined)
            directories[tag] = [tmp];
          else
            directories[tag].push(tmp);
        }
      }

      // to render all the scrollspy
      filter();
    }
  });

//////////////////////////////////////////////////////////
/////////////////////// General //////////////////////////
////////////////////////////////////////////////////////// 
  var general = $.ajax({
    dataType: 'json',
    url: 'http://localhost:3000/general.json',
    success: function() {
      general = jQuery.parseJSON(general.responseText)['paths'];
      var generalList = []
      for (var key in general) {
        for (sub_key in general[key]) {
            var tmp = new General({
              path: sub_key,
              description: general[key][sub_key],
              id: sub_key.replace(/\s+/g, '')
            });
            generalList.push(tmp);
        }
      }
      var generals = new Generals(generalList);
      generalView.render(generals);
      generalInfoView.render(generals);
    }
  });

//////////////////////////////////////////////////////////
///////////////////////// MODEL //////////////////////////
////////////////////////////////////////////////////////// 
  var Directory = Backbone.Model.extend({
    default: {
      tag: '',
      summaries: []
    }
  });

  var Directories = Backbone.Collection.extend({
    model: Directory
  });

  var General = Backbone.Model.extend({
    default: {
      path: '',
      id: '',
      description: ''
    }
  }); 

  var Generals = Backbone.Collection.extend({
    model: General
  })

//////////////////////////////////////////////////////////
////////////////////////// VIEW //////////////////////////
////////////////////////////////////////////////////////// 
  var ResultView = Backbone.View.extend({
    el: $('#scrollspy'),

    render: function(data) {
      var src = $('.directories-template').html();
      var template = Handlebars.compile(src);
      var html = template(data.toJSON());
      this.$el.html(html);
    }
  });
  var resultView = new ResultView();

  var GeneralView = Backbone.View.extend({
    el: $('#general-navigation'),

    render: function(data) {
      var src = $('.general-template').html();
      var template = Handlebars.compile(src);;
      var html = template(data.toJSON());
      this.$el.html(html);
    }
  });
  var generalView = new GeneralView();

  var GeneralInfoView = Backbone.View.extend({
    el: $('#general-info-navigation'),

    render: function(data) {
      var src = $('.general-info-template').html();
      var template = Handlebars.compile(src);;
      var html = template(data.toJSON());
      this.$el.html(html);
    }
  });
  var generalInfoView = new GeneralInfoView();

//////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// 
  function filter() {
    // clear out the last result
    showAll();

    // create a new directory in response to search input
    var verb = $('.search-verb').val();
    var tmp_keywords = $('.search-input').val().toLowerCase().split(/[ ]+/);
    var keywords = [];
    for (var i in tmp_keywords) {
      if (tmp_keywords[i].length > 0)
        keywords.push(tmp_keywords[i]);
    }


    var responseAll = [];
    for (var tag in directories) {
      
      // loop over each inside verbs
      var responseVerbs = []
      for (var verbMap in directories[tag]) {
        verbMap = directories[tag][verbMap];
        var verbId = '#' + verbMap['operationId'];
        // check if the verb matches
        var verbFound = (verb == verbMap['verb']);
        if (verb == 'all') verbFound = true;

        // check if the keyword matches
        var keywordFound = true;
        for (var i in keywords) {
          var keyword = keywords[i].toLowerCase();
          keywordFound = verbMap['keywords'].toLowerCase().indexOf(keyword);

          // all the keywords have to match the search terms
          if (keywordFound == -1) {
            keywordFound = false;
            break;
          }
        }

        // build up the obect to view render if wanted
        if (verbFound && keywordFound)
          responseVerbs.push({
            operationId: verbId.substring(verbId.indexOf('_') + 1),
            tag: tag
          });
        else
          $(verbId).hide();
      }

      // check if the tags need to be hidden
      if (responseVerbs.length == 0)
        $('#resource_' + tag).hide();
      else {
        var tmp = new Directory({
          tag: tag,
          summary: responseVerbs
        });
        responseAll.push(tmp);
      }
    }

    // render view based on the search result
    var tmp = new Directories(responseAll);
    resultView.render(tmp);

    // adding smooth jump only no highlighting.
    $('.sub-jumper').on('click', function(e) {
      e.preventDefault();
      
      // To open up the verb if it is currently block
      var target = $(this).attr('href');
      $(target + " > .content").css('display', 'block');
      $(target).parent().parent().parent().css('display', 'block');

      // Adding some animatiion to jump 
      $('body, html').animate({
        scrollTop: $(target).offset().top - 125
      }, 500);
    });

    // display sub menu
    $('.jumper').on('click', function(e) {
      e.preventDefault();
      var parent = $(this).parent();
      parent.find('ul').slideToggle();
    });
  }

  // to show all the swagger menu before filtering out content again
  function showAll() {
    for (var tag in directories) {
      $('#resource_' + tag).show();
      for (var verbMap in directories[tag]) {
        verbMap = directories[tag][verbMap];
        $('#' + verbMap['operationId']).show();
      }
    }
  }

  // attching a function to listen to value change in the search input.
  $('.search-input').on('input', filter);
  $('.search-verb').change(filter);

  // to prevent reload when press enter
  $('#api_selector').submit(function(e) { 
    return false;
  });

  // smooth scroll back to the top
  $('#arrow').on('click', function() {
    $('body, html').animate({
      scrollTop: 0
    }, 500);
  });
 

  $('#get_started').on('click', function() {
    $('#general').show();
    $('#scrollspy').hide();
    $('#swagger-ui-container').hide();
  });

  $('#documentation').on('click', function() {
    $('#general').hide();
    $('#scrollspy').show();
    $('#swagger-ui-container').show();
  });

});