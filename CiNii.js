{
	"translatorID": "46291dc3-5cbd-47b7-8af4-d009078186f6",
	"label": "CiNii",
	"creator": "Mikihiro Suda and Michael Berkowitz and Mitsuo Yoshida",
	"target": "https://cir\\.nii\\.ac\\.jp",
	"minVersion": "5.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2024-01-01 06:54:41"
}

/*
	***** BEGIN LICENSE BLOCK *****

	Copyright © 2024 Mikihiro SUDA, Michael Berkowitz and Mitsuo Yoshida

	This file is part of Zotero.

	Zotero is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	Zotero is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
	GNU Affero General Public License for more details.

	You should have received a copy of the GNU Affero General Public License
	along with Zotero. If not, see <http://www.gnu.org/licenses/>.

	***** END LICENSE BLOCK *****
*/


function detectWeb(doc, url) {
	// If url contains /crid/ and the CRID, the webpage is an article page
	if (/https:\/\/cir\.nii\.ac\.jp\/crid\/\d+/.test(url)) {
		// Use JSON-LD to detect the target content type
		// see: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
		// see: https://schema.org/docs/full.html
		const ldJson = JSON.parse(doc.querySelector(`head > script[type="application/ld+json"]`).textContent)
		const type = ldJson["@graph"][0]["@type"]

		switch (type) {
			case "ScholarlyArticle": {
				return "journalArticle";
			}
			case "Book": {
				return "book";
			}
			default: {
				return false;
			}
		}
	}

	// If <body> has result_list class, the webpage is search-result page
	if (doc.body.classList.contains("result_list")) {
		return "multiple";
	}

	// Other pages are not allowed
	return false;
}

function getSearchResults(doc, checkOnly) {
	const items = {};
	let found = false;
	const rows = Array.from(doc.querySelectorAll(".listContainer dt.item_title a.taggedlink"));
	for (const row of rows) {
		const href = row.href;
		const title = ZU.trimInternal(row.textContent);
		if (!href || !title) continue;
		if (checkOnly) return true;
		found = true;
		items[href] = title;
	}
	return found ? items : false;
}

async function doWeb(doc, url) {
	if (detectWeb(doc, url) == 'multiple') {
		const items = await Zotero.selectItems(getSearchResults(doc, false));
		if (!items) return;
		for (const url of Object.keys(items)) {
			await scrape(await requestDocument(url));
		}
	}
	else {
		await scrape(doc, url);
	}
}

async function __scrape(doc, url = doc.location.href) {
	Zotero.debug(doc.location.href)

	if (!(/https:\/\/cir\.nii\.ac\.jp\/crid\/\d+/.test(doc.location.href))) {
		return;
	}

	// You can download RIS file from https://cir.nii.ac.jp/crid/<crid>.ris
	const risUrl = doc.location.href + ".ris";

	const risText = await requestText(risUrl);

	// The RIS import translator
	const risTranslator = Zotero.loadTranslator("import");
	risTranslator.setTranslator("32d59d2d-b65a-4da4-b0a3-bdd3cfb979e7");
	risTranslator.setString(risText);

	await risTranslator.translate();
}

async function scrape(doc, url = doc.location.href) {
	const risURL = doc.location.href + ".ris";

	let risText = await requestText(risURL);
	let translator = Zotero.loadTranslator('import');
	translator.setTranslator('32d59d2d-b65a-4da4-b0a3-bdd3cfb979e7'); // RIS
	translator.setString(risText);
	translator.setHandler('itemDone', (_obj, item) => {
		item.complete();
	});

	await translator.translate();
}


/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "https://cir.nii.ac.jp/all?q=test&count=20&sortorder=0",
		"items": "multiple"
	},
	{
		"type": "web",
		"url": "https://cir.nii.ac.jp/crid/1390001204062164736",
		"items": [
			{
				"itemType": "journalArticle",
				"title": "観測用既存鉄骨造モデル構造物を用いたオンライン応答実験",
				"creators": [
					{
						"lastName": "大井",
						"firstName": "謙一",
						"creatorType": "author"
					},
					{
						"lastName": "嶋脇",
						"firstName": "與助",
						"creatorType": "author"
					},
					{
						"lastName": "伊藤",
						"firstName": "拓海",
						"creatorType": "author"
					},
					{
						"lastName": "李",
						"firstName": "玉順",
						"creatorType": "author"
					}
				],
				"date": "2002",
				"DOI": "10.11188/seisankenkyu.54.384",
				"ISSN": "1881-2058",
				"issue": "6",
				"libraryCatalog": "CiNii",
				"pages": "384-387",
				"publicationTitle": "生産研究",
				"url": "https://cir.nii.ac.jp/crid/1390001204062164736",
				"volume": "54",
				"attachments": [],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://cir.nii.ac.jp/crid/1130848328309201408",
		"items": [
			{
				"itemType": "book",
				"title": "ハリー・ポッターと賢者の石",
				"creators": [
					{
						"lastName": "Rowling",
						"firstName": "J. K.",
						"creatorType": "author"
					},
					{
						"lastName": "松岡",
						"firstName": "佑子",
						"creatorType": "author"
					}
				],
				"date": "2019",
				"ISBN": "9784863895201",
				"libraryCatalog": "CiNii",
				"publisher": "静山社",
				"series": "Harry Potter",
				"url": "https://cir.nii.ac.jp/crid/1130848328309201408",
				"attachments": [],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://cir.nii.ac.jp/crid/1050845762839862272",
		"items": [
			{
				"itemType": "journalArticle",
				"title": "5分で分かる! ? 有名論文ナナメ読み：Ashish Vaswani et al. : Attention Is All You Need",
				"creators": [
					{
						"lastName": "中澤",
						"firstName": "敏明",
						"creatorType": "author"
					}
				],
				"date": "2018-10",
				"ISSN": "04478053",
				"issue": "11",
				"libraryCatalog": "CiNii",
				"pages": "1040-1042",
				"publicationTitle": "情報処理",
				"shortTitle": "5分で分かる! ?",
				"url": "https://cir.nii.ac.jp/crid/1050845762839862272",
				"volume": "59",
				"attachments": [],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	}
]
/** END TEST CASES **/
