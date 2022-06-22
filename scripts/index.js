'use strict';

const graphColor = ['#0E1766','#710BC2','#F63AAC','#d281d2', '#7aa0cb', '#d281d2','#000000','#F6EBFF'];

const $tableID = $('#maintable-table');
$tableID.on('click', '.table-remove', function () { 
  $(this).parents('tr').detach(); 
  buildTree();

});
$tableID.on('click', '.table-up', function () {
  const $row = $(this).parents('tr');
  if ($row.index() === 0) { return; } $row.prev().before($row.get(0));
});

$(document).on("keyup", '#maintable-table tr td', function (e) {
  // $('#maintable-table tr td').on("keydown", function(){
  const row = $(this).parents('tr');
  var userId = row.children('.user-id').text().toLowerCase();
  var amount = row.children('.user-amount').text();
  let digest = sha256(userId + '|' + amount);

  row.children('.user-commitment').text(digest);

  buildTree();
});

buildTree();

$tableID.on('click', '.table-down', function () {
  const $row = $(this).parents('tr');
  $row.next().after($row.get(0));
});

$("#btn-add-user").click(function () {
  var toAppend = '<tr>';
  toAppend += '<td class="pt-3-half user-id" contenteditable="true">user_id</td>';
  toAppend += '<td class="pt-3-half user-amount" contenteditable="true">0</td>';
  toAppend += '<td class="pt-3-half user-commitment">commitment</td>';
  toAppend += '<td><span class="table-remove"><button type="button" class="btn btn-danger btn-rounded btn-sm my-0">Remove</button></span></td>';
  toAppend += '</tr>';

  $("#users_table").append(toAppend);
});


function buildTree() {

  let usersArr = tableUsersToArray();
  
  let treeArr = usersArrToUsersTreeArr(usersArr);

  updateVerifyPage(usersArr, treeArr);

  let diagramData = treeArrToTreeData(treeArr);

  buildDiagram(diagramData, "merkle-graph", "graph", true);

  buildDiagram(diagramData, "merkle-graph-verifer", "graph-b", false);
}

function tableUsersToArray() {
  // table to array object
  var convertedIntoArray = [];
  $("table#users_table tbody tr").each(function () {
    var rowData = {};
    var actualData = $(this).find('td');
    if (actualData.length > 0) {
      actualData.each(function () {
        if ($(this).hasClass("user-id")) {
          rowData.userId = $(this).text();
        } else if ($(this).hasClass("user-amount")) {
          rowData.amount = Number($(this).text());
        } else if ($(this).hasClass("user-commitment")) {
          rowData.commitment = $(this).text();
        }
      });

      convertedIntoArray.push(rowData);
    }
  });

  return convertedIntoArray;
}

function updateVerifyPage(convertedIntoArray, treeArr){
  fillVerifyUserSelect(convertedIntoArray);
  updateVerficationRootValue(treeArr[0].commitment);

}

function fillVerifyUserSelect(usersArr) {
  var select = document.getElementById("user-verify-select");

  var i, L = select.options.length - 1;
  for (i = L; i >= 0; i--) {
    select.remove(i);
  }

  var el = document.createElement("option");
  el.textContent = "Choose a User";
  el.value = "";
  el.hidden = true;
  el.disabled = true;
  el.selected = true;
  select.appendChild(el);

  for (var i = 0; i < usersArr.length; i++) {
    var opt = usersArr[i].userId;
    el = document.createElement("option");
    el.textContent = opt;
    el.value = opt;
    select.appendChild(el);
  }
}

function updateVerficationRootValue(rootCommitment) {
  $('#published-root-text').text(rootCommitment);
}

function usersArrToUsersTreeArr(records) {

  // build leaf level 
  let leafLevelLength = 1;
  for (; leafLevelLength < records.length; leafLevelLength = leafLevelLength * 2) { }

  let leafLevel = [];

  for (let i = 0; i < leafLevelLength; i++) {

    if (i < records.length) {
      leafLevel.push({ commitment: records[i].commitment, amount: records[i].amount });
    } else {
      leafLevel.push({ commitment: sha256(""), amount: 0 });
    }
  }

  let levels = [];
  levels.push(leafLevel);

  let currLevel = leafLevel
  for (; currLevel.length > 1;) {

    let nextLevel = [];
    for (let i = 1; i < currLevel.length; i = i + 2) {
      let amountsSum = currLevel[i - 1].amount + currLevel[i].amount;
      let nextItem = { commitment: sha256(amountsSum + currLevel[i - 1].commitment + currLevel[i].commitment), amount: amountsSum };
      nextLevel.push(nextItem);
    }

    levels.push(nextLevel);
    currLevel = nextLevel;
  }

  let res = [];
  for (let i = levels.length; i >= 0; i--) {
    res.push.apply(res, levels[i]);
  }

  return res;
}

function getNodeParnetOtherChild(node) {
  let cmmt = node.data.commitment;
  let parent = node.parent.data;

  let firstChild = parent.children[0];
  let secondChild = parent.children[1];

  if (cmmt === firstChild.commitment) {
    return secondChild;
  } else {
    return firstChild;
  }
}

function expandAllNodesInVerifyGraph() {
  let rootCommitment = document.getElementById("published-root-text");
  let rootNode = d3.select('graph-b .node[node-name="'+ rootCommitment.innerText + '"]');
  rescurisveExpand(rootNode.datum());
}

function rescurisveExpand(node) {
  if (!node.children) {
    collapseNodeOnGraphB(node.data.commitment.trim());
  }

  if (node.children) {
    rescurisveExpand(node.children[0]);
    rescurisveExpand(node.children[1]);
  }

}

function collapseNodeOnGraphB(cmmt) {
  $('#merkle-graph-verifer [node-name="'+ cmmt.trim() + '"]').parent()[0].dispatchEvent(new Event('click'));
}

$("#user-verify-select").on('change', function() {
  let cmmt = computeCommitmentAndPopulate(this.value); updateGraphB(cmmt);
});

function computeCommitmentAndPopulate(userId) {
  const trs = $('#users_table > tbody > tr');

  let isFound = false;
  let commitment = '';
  let amount = 0;

  for (let i = 0; i < trs.length; i++) {
    let ele = $(trs[i])
    if (ele.find("td:eq(0)").text() == userId) {
      isFound = true;
      amount = ele.find("td:eq(1)").text().trim();
      commitment = ele.find("td:eq(2)").text().trim();
    }
  }

  if (isFound == true) {
    let rowDiv = $('#verify-commitment-compution').html('');

    const formulaDiv = document.createElement("div");
    formulaDiv.classList.add("col-md-9");
    formulaDiv.innerHTML = '<p id ="commitment-eq">\\(commitment_{user} = sha256(Id_{user} | balance_{user}) = sha256(' + userId + ' | ' + amount + ')\\)' + 
    '<p id ="commitment-eq-2">\\(commitment_{user} = ' + commitment + '\\)';

    const externalVerifyDiv = document.createElement("div");
    externalVerifyDiv.classList.add("col-md-3");

    const verifyBtn = document.createElement("button");
    verifyBtn.classList.add("btn");
    verifyBtn.classList.add("btn-info");
    verifyBtn.textContent = "Verify externally";
    verifyBtn.onclick = function() {VerifyCommitmentExternally(userId,amount)};
    externalVerifyDiv.append(verifyBtn);
    rowDiv.append(formulaDiv);
    rowDiv.append(externalVerifyDiv);

    MathJax.typeset(['#commitment-eq', '#commitment-eq-2']);
  } else {
    alert('error - cant find user name on the users table');
    return "";
  }

  return commitment;
}

function VerifyCommitmentExternally(uName, amount) {
  window.open('https://md5calc.com/hash/sha256/' + uName + '|' + amount);
}

function updateGraphB(cmmt) {
  expandAllNodesInVerifyGraph();

  let currNode = d3.select('.node[node-name="'+ cmmt.trim() + '"]').datum();

    while (currNode.parent) {
      collapseNodeOnGraphB(getNodeParnetOtherChild(currNode).commitment.trim());
      currNode = currNode.parent;
    }

}

function treeArrToTreeData(array) {
  let level = 0;
  let idx = 1;
  let res = { name: array[idx - 1].amount.toString(), fill: graphColor[level], subname: shortHash(array[level].commitment), commitment: array[idx - 1].commitment };
  res.children = [];
  // left child

  let left = recursivee(idx + 1, level + 1, array);
  if (left) {
    res.children.push(left);
  }

  // right child
  let right = recursivee(idx + 2, level + 1, array);
  if (right) {
    res.children.push(right);
  }
  return res;
}

function recursivee(idx, level, array) {
  if (idx > array.length) {
    return "";
  }

  let res = { name: array[idx - 1].amount.toString(), fill: graphColor[level], subname: shortHash(array[idx - 1].commitment), commitment: array[idx - 1].commitment };
  res.children = [];

  // left child
  let left = recursivee(idx * 2, level + 1, array);
  if (left) {
    res.children.push(left);
  }

  // right child
  let right = recursivee((idx * 2) + 1, level + 1, array);
  if (right) {
    res.children.push(right);
  }

  return res;
}

function buildDiagram(treeData, deployToComponenetId, deployToComponenetType, isCollapsedAtInit) {
  const myNode = document.getElementById(deployToComponenetId);
  myNode.innerHTML = '';

  // Set the dimensions and margins of the diagram
  var margin = { top: 20, right: 90, bottom: 30, left: 90 },
    width = 960 - margin.left - margin.right,
    height = 700;

  // var svg = d3.select("graph").append("svg")
  var svg = d3.select(deployToComponenetType).append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate("
      + margin.left + "," + margin.top + ")");

  var i = 0,
    duration = 750,
    root;

  // declares a tree layout and assigns the size
  var treemap = d3.tree().size([height, width]);

  // Assigns parent, children, height, depth
  root = d3.hierarchy(treeData, function (d) { return d.children; });
  root.x0 = height / 2;
  root.y0 = 0;

  // Collapse after the second level
  if (isCollapsedAtInit == true) {
    root.children.forEach(collapse);
  }

  update(root);

  // Collapse the node and all it's children
  function collapse(d) {
    if (d.children) {
      d._children = d.children
      d._children.forEach(collapse)
      d.children = null
    }
  }

  function update(source) {

    // Assigns the x and y position for the nodes
    var treeData = treemap(root);

    // Compute the new tree layout.
    var nodes = treeData.descendants(),
      links = treeData.descendants().slice(1);

    // Normalize for fixed-depth.
    nodes.forEach(function (d) { d.y = d.depth * 180 });

    // Update the nodes...
    var node = svg.selectAll('g.node')
      .data(nodes, function (d) { return d.id || (d.id = ++i); });

    // Enter any new modes at the parent's previous position.
    var nodeEnter = node.enter().append('g')
      .attr('class', 'node')
      .attr("transform", function (d) {
        return "translate(" + source.x0 + "," + source.y0 + ")";
      })
      .on('click', click);

    var rectHeight = 60, rectWidth = 60;

    nodeEnter.append('circle')
      .attr('class', 'node')
      .attr("x", 0)
      .attr("stroke", "grey")
      .attr("r", 44)
      .attr("cy", 30)
      .attr("cx", 30)
      .attr("stroke-width", "2px")
      .attr('node-name', d => d.data.commitment.trim())
      .style("fill", function (d) {
        return d.data.fill;
      });

    // Add labels for the nodes
    nodeEnter.append('text')
      .attr("dy", "20px")
      .attr("x", function (d) {
        return 23;
      })
      
      .text(function (d) { return d.data.name; })
      .append("tspan")
      .attr("dy", "30px")
      .attr("x", function (d) {
        return 0;
      })
      .text(function (d) { return d.data.subname; })
      .attr("x", function (d) {
        return 3;
      });

    // UPDATE
    var nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate.transition()
      .duration(duration)
      .attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
      });

    // Update the node attributes and style
    // nodeUpdate.select('circle.node')
    //   .attr('r', 10)
    //   .style("fill", function (d) {
    //     return d._children ? "lightsteelblue" : "#fff";
    //   })
    //   .attr('cursor', 'pointer');


    // Remove any exiting nodes
    var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function (d) {
        return "translate(" + source.x + "," + source.y + ")";
      })
      .remove();

    // On exit reduce the node circles size to 0
    nodeExit.select('circle')
      .attr('r', 1e-6);

    // On exit reduce the opacity of text labels
    nodeExit.select('text')
      .style('fill-opacity', 1e-6);

    // ****************** links section ***************************

    // Update the links...
    var link = svg.selectAll('path.link')
      .data(links, function (d) { return d.id; });

    // Enter any new links at the parent's previous position.
    var linkEnter = link.enter().insert('path', "g")
      .attr("class", "link")
      .attr('d', function (d) {
        var o = { x: source.x0, y: source.y0 }
        return diagonal(o, o)
      });

    // UPDATE
    var linkUpdate = linkEnter.merge(link);

    // Transition back to the parent element position
    linkUpdate.transition()
      .duration(duration)
      .attr('d', function (d) { return diagonal(d, d.parent) });

    // Remove any exiting links
    var linkExit = link.exit().transition()
      .duration(duration)
      .attr('d', function (d) {
        var o = { x: source.x, y: source.y }
        return diagonal(o, o)
      })
      .remove();

    // Store the old positions for transition.
    nodes.forEach(function (d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });

    // Creates a curved (diagonal) path from parent to the child nodes
    function diagonal(s, d) {

      let path = `M ${s.x + (rectWidth / 2)} ${s.y}
          C ${(s.x + d.x) / 2 + (rectWidth / 2)} ${s.y},
            ${(s.x + d.x) / 2 + (rectWidth / 2)} ${d.y},
            ${d.x + (rectWidth / 2)} ${d.y}`

      return path
    }

    // Toggle children on click.
    function click(d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
      update(d);
    }
  }
}

function shortHash(hash) {
  let trimmedHash = hash.trim();
  let first = trimmedHash.substring(0, 3);
  let last = trimmedHash.substring(trimmedHash.length - 3);
  let res = first + '...' + last;

  return res;
}
