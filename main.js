var DEBUG = false;

var DEBUG_XML = `<?xml version="1.0"?>
<PurchaseOrder PurchaseOrderNumber="99503" OrderDate="1999-10-20">
  <Address Type="Shipping">
    <Name>Ellen Adams</Name>
    <Street>123 Maple Street</Street>
    <City>Mill Valley</City>
    <State>CA</State>
    <Zip>10999</Zip>
    <Country>USA</Country>
  </Address>
  <Address Type="Billing">
    <Name>Tai Yee</Name>
    <Street>8 Oak Avenue</Street>
    <City>Old Town</City>
    <State>PA</State>
    <Zip>95819</Zip>
    <Country>USA</Country>
  </Address>
  <DeliveryNotes>Please leave packages in shed by driveway.</DeliveryNotes>
  <Items>
    <Item PartNumber="872-AA">
      <ProductName>Lawnmower</ProductName>
      <Quantity>1</Quantity>
      <USPrice>148.95</USPrice>
      <Comment>Confirm this is electric</Comment>
    </Item>
    <Item PartNumber="926-AA">
      <ProductName>Baby Monitor</ProductName>
      <Quantity>2</Quantity>
      <USPrice>39.98</USPrice>
      <ShipDate>1999-05-21</ShipDate>
    </Item>
  </Items>
</PurchaseOrder>
`

class TreeElementBase{
    static #_element_template;

    #_element;
    #_template;
    #_hidden;

    #_init(){
        this.#_hidden = false;  // true will NOT work here until this.hidden is set. 
    }

    constructor(template_){
        this.#_init();
        if(template_){
            this.template = template_.cloneNode(true);
            this.#_element = this.#_template.cloneNode(true);
        }
    }

    set template(template_){
        this.#_template = template_;
    }

    get element(){
        return this.#_element;
    }
    set element(elem){ // Can this setter be deleted? Because the element should not be edited manually.
        this.#_element = elem;
    }

    setValueBySelector(selector, value){
        this.element.querySelector(selector, value);
    }

    get hidden(){
        return this.#_hidden;
    }
    set hidden(value_){
        // this.value ? this.#_element.classList.add("hidden") : this.#_element.classList.remove("hidden");
        value_ ? this.element.classList.add("hidden") : this.element.classList.remove("hidden");
        this.#_hidden = value_;
    }

    addEventListener(event_name, callback){
        console.log("added!")
        this.#_element.addEventListener(event_name, callback);
    }
        
}

class TreeAttributeElement extends TreeElementBase{
    static #_element_template = document.querySelector("#tree_template .attribute_item").cloneNode(true);

    #_attribute_name;
    #_attribute_value;

    #_init(){
        this.element = TreeAttributeElement.#_element_template.cloneNode(true);
        this.element.querySelector(".attribute_name").innerHTML = "";
        this.element.querySelector(".attribute_value").innerHTML = "";
        this.#_attribute_name = "";
        this.#_attribute_value = "";
    }

    constructor(name_, value_=-1){
        super();
        // usage1: TreeElementAttribute("atrname", "atrvalue")
        // usage2: TreeElementAttribute({name: "atrname", value: "atrvalue"})
        // usage3: TreeElementAttribute({attribute_name: "atrname", attribute_value: "atrvalue"})
        this.#_init();
        if (value_ !== -1 || typeof name_ === 'string' || name_ instanceof String){
            this.name = name_;
            this.value = value_;
        }
        else{
            let attribute_pair = Object.assign({}, name_);
            this.name = attribute_pair?.name || attribute_pair?.attribute_name || "";
            this.value = attribute_pair?.value || attribute_pair?.attribute_value || "";
        }
        this.hidden = false;
    }
    get name(){
        return this.#_attribute_name;
    }
    set name(name_){
        this.#_attribute_name = name_ || "";
        this.element.querySelector(".attribute_name").innerHTML = name_;
    }
    get value(){
        return this.#_attribute_value;
    }
    set value(value_){
        this.#_attribute_value = value_ || "" ;
        this.element.querySelector(".attribute_value").innerHTML = value_;
    }
}

class TreeElement extends TreeElementBase{
    static #_element_template = document.querySelector("#tree_template > .tree_item").cloneNode(true); // be const (not const)
    
    #_tag_name;
    #_short_name;   
    #_attributes;
    #_filename;
    #_children;
    #_parent;
    #_hidden_children;
    #_checkbox_checked;
    #_checkbox_disabled;

    #_init(){
        this.element = TreeElement.#_element_template.cloneNode(true);
        this.element.querySelector(".tag_name").innerHTML = "";
        this.element.querySelector(".short_name").innerHTML = "";
        this.element.querySelector(".attribute_item").remove();
        // this.element.querySelector(".attribute_name").innerHTML = "";
        // this.element.querySelector(".attribute_value").innerHTML = "";
        this.element.querySelector(".children").innerHTML = "";
        this.#_tag_name     = "";
        this.#_short_name   = "";
        this.#_attributes   = [];
        this.#_filename     = "";
        this.#_children     = [];
        this.#_parent       = undefined;
        this.#_checkbox_checked = 1;
        this.#_checkbox_disabled = 0;
    }

    constructor(options){
        super();
        this.#_init();
        this.tag_name        = options?.tag_name;
        this.short_name      = options?.short_name;
        this.attributes      = options?.attributes || [];
        this.filename        = options?.filename || "";

        // if(this.filename){
        //     console.log(this.filename);
        //     options.filename = "";
        //     options = {tag_name: this.filename, children: options};
        // }

        // Create children
        this.children        = options?.children || [];

        // Hidden and checkbox controll
        this.hidden = options?.hidden || false; //TODO: Should judge `options.hidden` is boolean or undefined.
        this.hidden_children = false;
        this.chekbox_cheked = !this.hidden_children;
        this.chekbox_disabled = !this.hasChild; //TODO: This should be re-set when this.children seemed to be changed.

        // Set click and right click callbacks
        this.#_setClickCallback();

        // TODO: Debug
        if(DEBUG) console.log("initialized:", this.tag_name)
    }

    #_debug(){
        let DEBUG = true;
        this.tag_name     = DEBUG ? "test_tag_name" : "";
        this.short_name   = DEBUG ? "test_short_name" : "";
        this.attributes   = DEBUG ? [
            {attribute_name: "test_attribute_name1", attribute_value: "test_attribute_value1"},
            {attribute_name: "test_attribute_name2", attribute_value: "test_attribute_value2"}
        ] : [];
        this.children   = DEBUG ? [
            {tag_name: "test_child_tag_name"},
            {tag_name: "test_child_tag_name"}
        ] : [];
    }

    #_setClickCallback(){ // TODO: Fix this.
        this.element.querySelector(".title_checkbox").onclick = ((captured_this) => {return function callback(e){
            captured_this.hidden_children = !captured_this.hidden_children;
        }})(this);

        this.element.querySelector(".title_menu_button").onclick = ((captured_this) => {return function callback(e){
            console.log("click!")
            // captured_this.hidden_children = !captured_this.hidden_children;
        }})(this);

        
    }


    get tag_name(){
        return this.#_tag_name;
    }
    set tag_name(value){
        this.#_tag_name = value;
        this.element.querySelector(".tag_name").innerHTML = value || "";
    }
    
    get short_name(){
        return this.#_short_name;
    }
    set short_name(value){
        this.#_short_name = value;
        this.element.querySelector(".short_name").innerHTML = value || "";
    }
    
    get attributes(){
        return this.#_attributes;
    }
    set attributes(values){
        // check the value is iterable
        if(Symbol.iterator in values) {
            for(let value of values){
                this.addAttributeByOneArg(value);
            }
        }
    }
    addAttributeByOneArg(attribute_pair_){
        let attrib = new TreeAttributeElement(attribute_pair_);
        this.#_addAttribute(attrib);
    }
    addAttributeByTwoArg(attribute_name_, attribute_value_){
        let attrib = new TreeAttributeElement(attribute_name_, attribute_value_);
        this.#_addAttribute(attrib);
    }
    #_addAttribute(attrib){
        this.#_attributes.push(attrib);
        this.element.querySelector(".attributes_table > tbody").append(attrib.element);
    }

    get children(){
        return this.#_children;
    }
    set children(values){
        // check the value is iterable
        if(Symbol.iterator in values) {
            for(let value of values){
                let child_tree = new TreeElement(value);
                this.addChild(child_tree);
            }
        }
    }
    addChild(child_tree){
        this.#_children.push(child_tree);
        this.element.querySelector(".children").append(child_tree.element);
    }

    get hidden_children(){
        return this.#_hidden_children;
    }
    set hidden_children(value_){
        let c = this.element.querySelector(".children");
        value_ ? 
            c.classList.add("hidden") :
            c.classList.remove("hidden");
        this.#_hidden_children = value_;
    }

    get hasChild(){
        return this.#_children.length > 0;
    }

    set chekbox_cheked(value){
        this.element.querySelector(".title_checkbox").checked = value;
        this.#_checkbox_checked = value;
    }
    set chekbox_disabled(value){
        this.element.querySelector(".title_checkbox").disabled = value;
        this.#_checkbox_disabled = value;
    }

}


class TreeViewElement extends TreeElement{
    #_parent_element;
    #_depth;

    constructor(parentElementOrSelector, options){
        super(options);
        if (typeof parentElementOrSelector === 'string' || parentElementOrSelector instanceof String){
            let node_selector = parentElementOrSelector;
            this.#_parent_element = document.querySelector(node_selector);
        }
        else{
            let parent_element__ = parentElementOrSelector;
            this.#_parent_element = parent_element__;
        }
        this.appendTo(this.#_parent_element);
        this.#_setClickCallback();
    }

    get parent_element(){
        return this.#_parent_element;
    }
    set parent_element(parent_element_){
        this.appendTo(parent_element_);
        this.#_parent_element = parent_element_;
    }

    appendTo(parent_element_){
        parent_element_.append(this.element)
    }

    #_setClickCallback(callback){ // TODO: Hidden should be controlled by each instance of TreeElement.
        return; // TODO: debug.
        callback = callback || (e => {
            console.log(e);
            let hidden_state;
            if(e.target.classList.contains("title_checkbox")){
                for(let path_elem of e.path){
                    if(path_elem.classList.contains("tree_item")){
                        let c = path_elem.querySelector(".children");
                        hidden_state = c.classList.contains("hidden");
                        hidden_state ? 
                            c.classList.remove("hidden") : 
                            c.classList.add("hidden");
                        let b = path_elem.querySelector(".title_checkbox");
                        b.checked = hidden_state;
                        break;
                    }
                }
            }
        });
        this.parent_element.addEventListener("click", callback);        
    }
}


class TreeViewXML{
    static #_dom_parser = new DOMParser();

    #_xml_string;
    #_dom;
    #_tree;
    #_filename;
    
    #_init(){
        this.#_xml_string = "";
        this.#_tree = {};
        this.#_filename = "";
    }

    constructor(parentElementOrSelector, xml_string = "", options){
        this.#_init();

        if(xml_string === ""){
            throw Error("Error. Please provide xml_string!");
        }

        this.#_xml_string = xml_string 
        this.#_dom = this.toDom(this.#_xml_string);
        this.#_filename = options?.filename || "";

        // Create Option of tree
        let optionObj = this.makeOptionObj();
        
        // If filename is set, wrap Option by {tag_name: filename}.
        if(this.filename){
            optionObj = {tag_name: "# " + this.filename, children: [optionObj]};
        }
        // this.#_tree = Object.assign(options || {}, optionObj);
        this.#_tree = optionObj;

        this.tree_element = new TreeViewElement(parentElementOrSelector, this.#_tree);
    }

    get dom(){
        return this.#_dom;
    }
    get tree(){
        return this.#_tree;
    }
    get filename(){
        return this.#_filename;
    }
    set filename(value){
        this.#_filename = value;
    }

    toDom(xml_string_){
        this.#_dom = TreeViewXML.#_dom_parser.parseFromString(xml_string_, "application/xml");
        return this.#_dom;
    }

    makeOptionObj(){
        let target_dom = this.#_dom.children[0];
        let opt = TreeViewXML.#_domToOptionObj(target_dom);
        TreeViewXML.#_rep(target_dom, opt);
        
        return opt;
    }

    static #_domToOptionObj(dom){
        let attributes = [];
        for(let atr of dom.attributes){
            let atrr = {attribute_name: atr.name, attribute_value: atr.value};
            attributes.push(atrr);
        }

        let short_name;
        if(!(dom.innerHTML.includes("<")) && dom.textContent.trim()){
            short_name = dom.textContent;
        }

        let obj = {
            tag_name:  dom.nodeName,
            short_name: short_name || dom.querySelector("SHORT-NAME")?.value || "",
            attributes: attributes,
            children: []
        }

        return obj;
    }

    static #_rep(parent_dom, parent_obj){
        
        let parent_children = [];
        for(let child_dom of parent_dom.children){
            if(child_dom.nodeName == "SHORT-NAME"){
                continue;
            }
            let child_obj = TreeViewXML.#_domToOptionObj(child_dom);
            let children = TreeViewXML.#_rep(child_dom, child_obj);
            parent_children.push(child_obj);
        }
        parent_obj.children = parent_children;
        return parent_children;
    }


}


if (DEBUG){
    document.onload = (() => {
        ttt = new TreeViewElement("#tree", {
            tag_name: "tag1",children: [
                {tag_name: "tag2"},
                {tag_name: "tag3", short_name: "short", children: [
                    {tag_name: "tag3-1"},
                    {tag_name: "tag3-2", attributes: [{name: "attribute1", value: "hoge"}, {name: "attribute2", value: "hoge"}, ]},
                    {tag_name: "tag3-3"},
                ]},
                {tag_name: "tag4"},
                {tag_name: "tag5"},
            ]
        });
    })();

    console.log(ttt);
}

if (DEBUG){
    sss = new TreeViewXML("#tree2", DEBUG_XML);
}


window.addEventListener("load", e => {
    var files = [];
    let add_file_button = document.querySelector("#add_file");
    add_file_button.addEventListener("change", e => {
        
        
        files.push(...e.target.files);
        for(let file of files){
            console.log(file);
            var reader = new FileReader();
            reader.onload = e => {
                console.log(e)
                xml_string = e.target.result;

                
                tree_view = new TreeViewXML("#main", xml_string, {filename: file.name});
            };

            reader.readAsText(file);
        }
    });
})
