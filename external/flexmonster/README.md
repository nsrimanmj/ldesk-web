
# What is JS Pivot Table by Flexmonster?

Flexmonster Pivot Table & Charts is a component for interactive pivot reports that can be [inserted to a web page or a web application](https://www.flexmonster.com/demos/pivot-table-js/?r=npm). It’s a powerful JavaScript tool to visualize your business data.

Flexmonster Pivot is a cross-platform web component that seamlessly works on any browser (Chrome, Firefox, Internet Explorer, Safari or Opera) across Windows, macOS, Linux, iOS or Android. 

Moreover, you have no limitation on server-side technology, no matter whether your website runs on .NET, Java, PHP, Ruby, etc.

# Installation and usage
Start by installing Flexmonster as a node module and save it as a dependency in your package.json:
```
npm i flexmonster
```

Then, include the `flexmonster.full.js` and `flexmonster.css` files (for example, in the .html):
```html
<link href="node_modules/flexmonster/flexmonster.css" rel="stylesheet"/>
<script src="node_modules/flexmonster/flexmonster.full.js" type="text/javascript"></script>
```

Now, you can create an instance of Pivot Table:
```html
<div id="pivot-сontainer">The component will appear here</div>
<script>
	var pivot = new Flexmonster({
		container: "#pivot-сontainer",
		toolbar: true
	});
</script>
```
Refer to the [Quick Start](https://www.flexmonster.com/doc/how-to-create-js-pivottable/?r=npm) guide for more details.

**Note:** to use Flexmonster in production you need a license key. If you don’t have a license key, please visit [www.flexmonster.com](https://www.flexmonster.com/pivot-table-editions-and-pricing/?r=npm) to obtain an appropriate license. Then, you can specify `licenseKey` in the configuration:
```js
var pivot = new Flexmonster({
	licenseKey: "XXXX-XXXX-XXXX-XXXX-XXXX",
	container: "#pivot-сontainer",
	toolbar: true
});
```

# Why use Flexmonster Pivot Table & Charts component?

## Easy to integrate

Flexmonster Pivot can be natively used with JavaScript or [TypeScript](https://www.flexmonster.com/doc/integration-with-typescript/?r=npm) and perfectly integrates with the following client-side frameworks: 

- [AngularJS](https://www.flexmonster.com/doc/integration-with-angularjs/?r=npm)
- [Angular](https://www.flexmonster.com/doc/integration-with-angular/?r=npm)
- [React](https://www.flexmonster.com/doc/integration-with-react/?r=npm)
- [Webpack](https://www.flexmonster.com/doc/integration-with-webpack/?r=npm)

## Supports the most common data sources

- [JSON](https://www.flexmonster.com/doc/json-data-source/?r=npm)
- [SQL databases: MS SQL, MySQL, and others](https://www.flexmonster.com/doc/connect-to-relational-database/?r=npm)
- [CSV](https://www.flexmonster.com/doc/csv-data-source/?r=npm)
- [Elasticsearch](https://www.flexmonster.com/doc/connecting-to-elasticsearch/?r=npm)
- [Microsoft Analysis Services OLAP cubes](https://www.flexmonster.com/doc/connecting-to-microsoft-analysis-services/?r=npm)
- [Mondrian](https://www.flexmonster.com/doc/connecting-to-pentaho-mondrian/?r=npm)

## High speed in visualizing your data 

This solution allows you to work extremely fast with really [large data volumes](https://www.flexmonster.com/demos/?r=npm) (huge OLAP cubes, data sets from SQL DBs or files up to 140 MB).

Maximum data size is limited only by your end-users’ browsers and the capacity of their devices. The table renders multiple millions of cells immediately. If the user’s browser can handle it, we’ll display it.

Working with OLAP cubes, a browser component can communicate with the server via XMLA protocol or you can use [Flexmonster Accelerator for OLAP cubes](https://www.flexmonster.com/doc/getting-started-with-accelerator-ssas/?r=npm). It’s a special server-side proxy that helps you to increase data loading speed from server to customer’s browser tenfold.

## Smart features to analyze and manage your data

Our pivot component provides Excel-like features which give users the interface they have always been used to. The users can easily and quickly analyze data and produce a report using different options such as:

- Filtering
- Sorting
- Grouping fields in rows and columns
- Drill-down
- Drill-through
- Calculated fields
- Number formatting
- Aggregations
- Conditional formatting

You can find [all list of the set of tools](https://www.flexmonster.com/user-interface/?r=npm).

# Customizable & flexible
## Extensive API
  
Our component has convenient full-functional JavaScript API to embed the component into web applications. Being a developer, you can:
- Define what features you want to enable/disable
- Build your own scenarios around the component.

[API Reference](https://www.flexmonster.com/api/?r=npm)

## Localizing component
  
Flexmonster Pivot can be easily localized:
First of all, if you use one of the offered languages below, you can download the already prepared JSON files :

- [English](https://github.com/flexmonster/pivot-localizations/blob/master/en.json)
- [Español](https://github.com/flexmonster/pivot-localizations/blob/master/es.json)
- [Français](https://github.com/flexmonster/pivot-localizations/blob/master/fr.json)
- [Português](https://github.com/flexmonster/pivot-localizations/blob/master/pr.json)
- [Chinese](https://github.com/flexmonster/pivot-localizations/blob/master/ch.json)
- [Українська](https://github.com/flexmonster/pivot-localizations/blob/master/ua.json)
- [Italiano](https://github.com/flexmonster/pivot-localizations/blob/master/it.json)
- [Hungarian](https://github.com/flexmonster/pivot-localizations/blob/master/hu.json)
- [German](https://github.com/flexmonster/pivot-localizations/blob/master/de.json)
- [Dutch](https://github.com/flexmonster/pivot-localizations/blob/master/nl.json)
- [Turkish](https://github.com/flexmonster/pivot-localizations/blob/master/tr.json)
- [Thai](https://github.com/flexmonster/pivot-localizations/blob/master/th.json)
- [Indonesian](https://github.com/flexmonster/pivot-localizations/blob/master/id.json)

[Set localization for Pivot Table](https://www.flexmonster.com/doc/localizing-component/?r=npm)

## Compose report layout
Select which dimensions & values to show.
Users can easily change a report’s layout visually and examine the data from a different perspective. The power of Pivot report composing allows you to stop guessing all possible report scenarios your end-users might require. The user will be able to tune it to their own needs on the fly.

## Save & load reports
Users can create their own reports and save them to their local drive or the server and load previously saved reports with exactly the same layout, number formatting, filters, sorting and all the other settings.

This allows users to work with a predefined set of reports or create & save their own reports. Once the user has composed a report to reveal the precise data views that they need, they may want to save it for the future or share it with others.


## Export & print

All table views (compact/classic/flat form) and charts view can be printed or exported.
Users can export the reports into a variety of formats:

- Microsoft Excel 7
- PDF
- Web page (HTML page)
- CSV (comma separated text format)
- Image (PNG)   

You can control where to save the export data, the following methods are supported:

- Save to local file
- Save to server (to remote file-storage or database)

# Resources
- [Demos](https://www.flexmonster.com/demos/?r=npm)
- [Documentation](https://www.flexmonster.com/doc/?r=npm)
- [User interface](https://www.flexmonster.com/user-interface/?r=npm)
- [Blog](https://www.flexmonster.com/blog/?r=npm)

You can also get support from our Tech team by raising a ticket via [Flexmonster Help Center](http://www.flexmonster.com/help-center/?r=npm).