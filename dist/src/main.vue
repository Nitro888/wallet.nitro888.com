<template>
  <div>
    <b-carousel style="text-shadow: 1px 1px 2px #333;"
                controls
                indicators
                background="#ababab"
                :interval="10000"
                img-width="1280"
                img-height="480"
                v-model="slide"
                @sliding-start="onSlideStart"
                @sliding-end="onSlideEnd"
    >
      <!-- Text slides with image -->
      <b-carousel-slide caption="Avatar"
                        text="Create your wallet avatar."
                        img-src="./avatar.jpg"
      ></b-carousel-slide>
      <b-carousel-slide caption="Store"
                        text="Create your own stroe for digital contents."
                        img-src="./books.jpg"
      ></b-carousel-slide>
      <b-carousel-slide caption="Casino"
                        text="Create your own casino and play."
                        img-src="./casino.jpg"
      ></b-carousel-slide>
    </b-carousel>

    <editor ref="editorModal"></editor>

    <b-modal ref="refModal" :size="modal.size" :title="modal.title" :header-bg-variant="modal.headerBg" :header-text-variant="modal.headerTxt" hide-footer>
      <div class="d-block text-center" v-html="modal.html"></div>
      <b-input-group v-for='item in modal.items' v-bind:item="item" v-bind:key="item.store" size="sm" class="mb-1">
        <b-form-input :value="item.key" readonly></b-form-input>
        <b-input-group-append>
          <b-btn size="sm" variant="outline-primary" target="_blank" :href="item.actions.link"><i class="fas fa-link"></i></b-btn>
          <b-btn size="sm" variant="outline-primary" v-on:click="item.actions.contract(item.key);"><i class="fas fa-info-circle"></i></b-btn>
        </b-input-group-append>
      </b-input-group>
    </b-modal>

    <b-modal ref="refModalContract" :title="contract.title" header-bg-variant="dark" header-text-variant="light" hide-footer>

      <b-nav pills justified tabs class="mb-2">
        <b-nav-item :active="contract.tab==0" :disabled="contract.address!=''||!isLogedIn" v-on:click="contract.tab=0;"><i class="fas fa-plus"></i></b-nav-item>
        <b-nav-item :active="contract.tab==1" :disabled="contract.address==''||!isOwner" v-on:click="contract.tab=1;"><i class="fas fa-exchange-alt"></i></b-nav-item>
        <b-nav-item :active="contract.tab==2" :disabled="contract.address==''||!isOwner||!isPack" v-on:click="contract.tab=2;"><i class="fas fa-store"></i></b-nav-item>
        <b-nav-item :active="contract.tab==3" :disabled="contract.address==''||!isOwner||isStore||isCreator||isErc20Wallet" v-on:click="contract.tab=3;"><i class="fas fa-file-invoice-dollar"></i></b-nav-item>
        <b-nav-item :active="contract.tab==4" :disabled="contract.address==''||!isOwner" v-on:click="contract.tab=4;"><i class="fas fa-file-signature"></i></b-nav-item>
        <b-nav-item :active="contract.tab==5" :disabled="contract.address==''" v-on:click="contract.tab=5;"><i class="fas fa-info-circle"></i></b-nav-item>
      </b-nav>

      <b-form-group size="sm" label="Contract" v-if="contract.address!=''">
        <b-input-group size="sm">
          <b-form-input size="sm" type="text" v-model="contract.address" readonly></b-form-input>
          <b-input-group-append>
            <b-btn size="sm" variant="info" target="_blank" :href="contract.link"><i class="fas fa-link"></i></b-btn>
          </b-input-group-append>
        </b-input-group>
      </b-form-group>

      <b-form-group size="sm" label="Owner" label-for="owner" invalid-feedback="This is a wrong address." :state="isAddressOwner" v-if="contract.tab!=0">
        <b-form-input size="sm" type="text" id="owner" placeholder="address of contract owner" v-model="data.owner" :readonly="contract.tab!=1"></b-form-input>
      </b-form-group>
      <b-form-group size="sm" label="Store" label-for="store" invalid-feedback="This is a wrong address." :state="isAddressStore" v-if="isPack">
        <b-form-input size="sm" type="text" id="store" placeholder="address of store" v-model="data.store" :readonly="contract.tab!=2"></b-form-input>
      </b-form-group>
      <b-form-group size="sm" label="Creator" label-for="creator" invalid-feedback="This is a wrong address." :state="isAddressCreator" v-if="isPack">
        <b-form-input size="sm" type="text" id="store" placeholder="address of creator" v-model="data.creator" :readonly="contract.tab!=2"></b-form-input>
      </b-form-group>

      <b-form-group size="sm" label="Name" label-for="name">
        <b-form-input size="sm" id="name" placeholder="enter name" v-model="json.title" :readonly="!(contract.tab==0||contract.tab==4)"></b-form-input>
      </b-form-group>
      <b-form-group size="sm" label="Description" label-for="desc">
        <b-form-textarea size="sm" id="desc" placeholder="enter description" v-model="json.desc" :readonly="!(contract.tab==0||contract.tab==4)"></b-form-textarea>
      </b-form-group>

      <b-form-group size="sm" label="Token Address" label-for="token" invalid-feedback="This is a wrong address." :state="isAddressErc20" v-if="showErc20">
        <b-form-input size="sm" type="text" id="token" placeholder="erc20 token address or '0x0' for ethereum" v-model="data.erc20" :readonly="contract.tab!=0"></b-form-input>
      </b-form-group>
      <b-form-group size="sm" label="Price" label-for="price" v-if="showPrice">
        <b-form-input size="sm" type="number" id="price" placeholder="price of avatar making" v-model="data.price" :readonly="!(contract.tab==0||contract.tab==3)"></b-form-input>
      </b-form-group>
      <b-form-group size="sm" label="Stamp" label-for="stamp" v-if="showStamp">
        <b-form-input size="sm" type="number" id="stamp" min="0" max="255" placeholder="stamps for 1 free coupon (0~255, 0 is not free coupon)" v-model="data.stamp" :readonly="!(contract.tab==0||contract.tab==3)"></b-form-input>
      </b-form-group>
      <b-form-group size="sm" label="Share" label-for="share" v-if="showShare">
        <b-input-group size="sm">
          <b-form-input size="sm" type="number" id="share" min="0" max="100" placeholder="share with store and creator (0~100)" v-model="data.share" :readonly="!(contract.tab==0||contract.tab==3)"></b-form-input>
          <b-input-group-text slot="append"><i class="fas fa-percent"></i></b-input-group-text>
        </b-input-group>
      </b-form-group>
      <b-form-group size="sm" label="Share Start" label-for="shareStart" v-if="showShareStart">
        <b-form-input size="sm" type="number" id="shareStart" placeholder="share start income" v-model="data.shareStart" :readonly="!(contract.tab==0||contract.tab==3)"></b-form-input>
      </b-form-group>

      <b-btn size="sm" v-b-toggle.communities variant="outline-primary" class="mt-4" block>Communities</b-btn>
      <b-collapse id="communities" v-model="contract.communities">
        <b-card>
          <b-input-group v-for='item in communities' v-bind:key="item.name" size="sm" :prepend='item.icon' class="mb-2">
            <b-form-input :placeholder="item.placeholder" v-model="json[item.name]" :readonly="!(contract.tab==0||contract.tab==4)"></b-form-input>
          </b-input-group>
        </b-card>
      </b-collapse>

      <b-form-group size="sm" label="Password" class="mt-3" :invalid-feedback="contract.message" :valid-feedback="contract.message" :state="contract.state" v-if="isLogedIn">
        <b-input-group size="sm">
          <b-form-input size="sm" type="password" placeholder="password" v-model="contract.password" :readonly="contract.tab==5"></b-form-input>
          <b-input-group-append>
            <b-btn size="sm" variant="info" v-on:click="_confirmContract()" :disabled="contract.tab==5"><i class="fas fa-handshake"></i></b-btn>
          </b-input-group-append>
        </b-input-group>
      </b-form-group>
    </b-modal>

    <b-container>
      <br/>

      <div v-for="content in contents" v-bind:key="content.title">
        <hr/>
        <b-row>
          <b-col lg="5">
            <b-img fluid :src="content.image" border-variant="light"/>
          </b-col>
          <b-col lg="7">
            <h2>{{content.title}}&nbsp<h6 style="display: inline-block;">
              <a v-if="address[content.title]&&wallet.option" :href="address[content.title]?wallet.option['network']['href']+'/address/'+address[content.title]:null" target="_blank"><i class="fas fa-link"></i></a>
              <a v-if="github[content.title]" :href="github[content.title]?github[content.title]:null" target="_blank"><i class="fab fa-github"></i></a>
            </h6></h2>

            <div v-for="sub in content.inputs" v-bind:key="sub.key">
              <h5>{{sub.title}}</h5>
              <p><span v-html="sub.desc"></span></p>
              <b-form-group size="sm" v-if="sub.input" invalid-feedback="This is a wrong address." :state="sub.state" class="mb-3">
                <b-input-group size="sm">
                  <b-input-group-prepend>
                    <b-btn size="sm" v-if="isLogedIn" variant="secondary" v-on:click="contract2(sub.key)"><i class="fas fa-plus"></i></b-btn>
                    <b-btn size="sm" v-if="isLogedIn" variant="secondary" v-on:click="list(sub.key)"><i class="fas fa-list-ul"></i></b-btn>
                  </b-input-group-prepend>
                  <b-form-input type="text" placeholder="contract adress" v-model="sub.address"></b-form-input>
                  <b-input-group-append>
                    <b-btn size="sm" variant="outline-primary" v-if="sub.key==KEYS['STORE_AVATAR']['KEY']&&wallet.address()" v-on:click="showAvatarEditor(sub.address)"><i class="fas fa-user-circle"></i></b-btn>
                    <b-btn size="sm" variant="outline-primary" v-on:click="about(sub.key,sub.address)"><i class="fas fa-info-circle"></i></b-btn>
                  </b-input-group-append>
                </b-input-group>
              </b-form-group>
            </div>

          </b-col>
        </b-row>
      </div>

    </b-container>
    <b-container>
      <hr/>
      <p>Copyright &copy; nitro888.com</p>
    </b-container>
  </div>
</template>

<script>
  window.store  = require('./abi/store.js');
  window.wallet.pushContract(window.store.manager,window.store.address);

  Vue.component('editor', require('./avatar/editor.vue').default);

  const KEYS  = {
    'WALLET'        : {'KEY':'WALLET',        'TITLE':'Wallet'},
    'ERC20WALLET'   : {'KEY':'ERC20WALLET',   'TITLE':'Erc20 universal wallet'},
    'STORE_AVATAR'  : {'KEY':'STORE_AVATAR',  'TITLE':'Avatar store'},
    'BADGE'         : {'KEY':'BADGE',         'TITLE':'Badge'},
    'STORE_CONTENTS': {'KEY':'STORE_CONTENTS','TITLE':'Contents store'},
    'CREATOR'       : {'KEY':'CREATOR',       'TITLE':'Contents creator'},
    'PACK'          : {'KEY':'PACK',          'TITLE':'Contents pack'},
    'TICKET'        : {'KEY':'TICKET',        'TITLE':'Ticket store'},
    'CASINO'        : {'KEY':'CASINO',        'TITLE':'Casino'}
  };

  export default {
    data () {
      return {
        slide: 0,
        sliding: null,

        modal:{title:'',size:'md',headerBg:'',headerTxt:'',html:'',items:[]},

        KEYS:KEYS,
        wallet:window.wallet,
        address: {
          AVATAR:window.config.address,
          STORE:window.store.address,
          CREATOR:window.store.address,
        },
        github:{
          WALLET:'https://github.com/Nitro888/nitro888.github.io',
          AVATAR:'https://github.com/Nitro888/nitro888.github.io',
          STORE:'https://github.com/Nitro888/toonist.nitro888.com',
          CREATOR:'https://github.com/Nitro888/toonist.nitro888.com',
        },

         // tab 0 = create, 1 = owner, 2 = store, 3 = price, 4 = desc, 5 = readonly
        contract:{title:'',state:true,message:'',password:'',communities:false,address:'',link:'#',key:'',tab:0},
        communities:[
          {icon:'<i class="fas fa-at"></i>',name:'e-mail',placeholder:'e-mail'},
          {icon:'<i class="fab fa-facebook-f"></i>',name:'facebook',placeholder:'facebook id'},
          {icon:'<i class="fab fa-twitter"></i>',name:'twitter',placeholder:'twitter id'},
          {icon:'<i class="fab fa-instagram"></i>',name:'instagram',placeholder:'instagram id'},
          {icon:'<i class="fab fa-twitch"></i>',name:'twitch',placeholder:'twitch id'},
          {icon:'<i class="fab fa-reddit-alien"></i>',name:'reddit',placeholder:'reddit id'},
          {icon:'<i class="fab fa-telegram-plane"></i>',name:'telegram',placeholder:'telegram id'},
          {icon:'<i class="fab fa-discord"></i>',name:'discord',placeholder:'discord id'},
          {icon:'<i class="fab fa-slack-hash"></i>',name:'slack',placeholder:'slack id'},
          {icon:'<i class="fab fa-youtube"></i>',name:'youtube',placeholder:'youtube id'},
          {icon:'<i class="fas fa-comment-alt"></i>',name:'disqus',placeholder:'disqus id'},
        ],

        json:{title:'',desc:''},
        data:{owner:'',creator:'',store:'',erc20:'',price:'',shareStart:'',share:'',stamp:''},

        contents:[
          {left:false,title:"WALLET",image:'c0.jpg',
            inputs:[
              { input:false,key:KEYS['WALLET']['KEY'],address:'',state:true,
                title:'How to get a wallet.',
                desc:'If you want to create a wallet, click <i class="far fa-plus-square"></i> icon at menu bar and input passwords and click create button.'},
              { input:true,key:KEYS['ERC20WALLET']['KEY'],address:'',state:true,
                title:'How to get a erc20 universal wallet.',
                desc:'After login, click <i class="fas fa-plus"></i> button.<br/>And input a password and click <i class="fas fa-handshake"></i> button.'}]
          },
          {left:true,title:"AVATAR",image:'c1.jpg',
            inputs:[
              { input:true,key:KEYS['STORE_AVATAR']['KEY'],address:'',state:true,
                title:'How to get your avatar store.',
                desc:'After login, click <i class="fas fa-plus"></i> button, and write avatar store name, ERC20 contract address or \'0x0\' for Ethereum, and set price of making avatar. You can also change the price of making avatar after creation.<br/>And input a password and click <i class="fas fa-handshake"></i> button.<br/>Sample store is "0xd3f6f8677f875cec8ddde00cafb6ea558bab71dc"'},
              { input:true,key:KEYS['BADGE']['KEY'],address:'',state:true,
                title:'How to get your badge store.',
                desc:'After login, click <i class="fas fa-plus"></i> button, and write badge store name and etc.<br/>And input a password and click <i class="fas fa-handshake"></i> button.'}]
          },
          {left:false,title:"STORE",image:'c2.jpg',
            inputs:[
              { input:true,key:KEYS['STORE_CONTENTS']['KEY'],address:'',state:true,
                title:'How to get your digital contents store.',
                desc:'After login, click <i class="fas fa-plus"></i> button, and write store name and etc.<br/>And input a password and click <i class="fas fa-handshake"></i> button.'},
              { input:true,key:KEYS['PACK']['KEY'],address:'',state:true,
                title:'How to create digital contents pack at store.',
                desc:'After login, click <i class="fas fa-plus"></i> button, and write pack name and etc.<br/>And input a password and click <i class="fas fa-handshake"></i> button.'}]
          },
          {left:true,title:"CREATOR",image:'c3.jpg',
            inputs:[
              { input:true,key:KEYS['CREATOR']['KEY'],address:'',state:true,
                title:'How to get contents creator account.',
                desc:'After login, click <i class="fas fa-plus"></i> button, and write store name and etc.<br/>And input a password and click <i class="fas fa-handshake"></i> button.'}]
          },
          {left:false,title:"TICKET",image:'c4.jpg',
            inputs:[
              { input:false,key:KEYS['TICKET']['KEY'],address:'',state:true,
                title:'Create ticket booth for yours.',
                desc:'Coming soon.'}]},
          {left:true,title:"CASINO",image:'c5.jpg',
            inputs:[
              { input:false,key:KEYS['CASINO']['KEY'],address:'',state:true,
                title:'Create your own casino and play.',
                desc:'Coming soon.'}]},
        ]
      }
    },
    computed: {
      isLogedIn: function () {
        return this.wallet.web3&&this.wallet.address();
      },
      isOwner: function () {
        return this.wallet.web3&&this.wallet.address()&&this.data.owner.toLowerCase()==this.wallet.address().toLowerCase();
      },
      isAddressOwner: function () {
        return this.data.owner==''||this.wallet.isAddress(this.data.owner);
      },
      isAddressStore: function () {
        return this.data.store==''||this.wallet.isAddress(this.data.store);
      },
      isAddressCreator: function () {
        return this.data.creator==''||this.wallet.isAddress(this.data.creator);
      },
      isAddressErc20: function () {
        return this.data.erc20==''||this.wallet.isAddress(this.data.erc20);
      },
      isErc20Wallet : function () {
        return this.contract.key==KEYS['ERC20WALLET']['KEY'];
      },
      isStore : function () {
        return this.contract.key==KEYS['STORE_CONTENTS']['KEY'];
      },
      isPack : function () {
        return this.contract.key==KEYS['PACK']['KEY'];
      },
      isCreator : function () {
        return this.contract.key==KEYS['CREATOR']['KEY'];
      },
      showErc20 : function () {
        return this.contract.key==KEYS['STORE_AVATAR']['KEY']||this.contract.key==KEYS['STORE_CONTENTS']['KEY'];
      },
      showPrice : function () {
        return this.contract.key==KEYS['STORE_AVATAR']['KEY'];
      },
      showStamp : function () {
        return this.contract.key==KEYS['STORE_AVATAR']['KEY'];
      },
      showShare : function () {
        return this.contract.key==KEYS['PACK']['KEY'];
      },
      showShareStart : function () {
        return this.contract.key==KEYS['PACK']['KEY'];
      }
    },
    methods: {
      //------------------------------------------------------------------------------------------------
      onSlideStart (slide) {
        this.sliding = true
      },
      onSlideEnd (slide) {
        this.sliding = false
      },
      //------------------------------------------------------------------------------------------------
      showModal(title,size,header,html) {
        this.modal.title          = title;
        this.modal.size           = size;
        this.modal.headerBg       = header;
        this.modal.headerTxt      = header=='dark'?'light':'dark';
        this.modal.html           = html;
        this.modal.items          = [];
        this.$refs.refModal.show();
      },
      updateModal(html,items) {
        this.modal.html           = html;
        this.modal.items          = items;
      },
      //------------------------------------------------------------------------------------------------
      _resetData() {
        for (let field in this.json)
          this.json[field] = '';
        for (let field in this.data)
          this.data[field] = '';
      },
      _json(obj)       {
        let json = {};
        for (var key in obj)
          if(obj[key]!='')
            json[key] = obj[key];
        return json;
      },
      _searchOwner(contract,callback){
        let myAddress = this.wallet.web3.utils.padLeft(this.wallet.address(),64);
        let topics    = 'topic0='+contract.topic0+'&topic2='+myAddress+'&topic3='+myAddress+'&topic2_3_opr=or';
        this.wallet.logs(contract.address,topics,(data)=>{
          let list = [];
          for(let i = 0 ; i < data.length ; i++) {
            let address = '0x'+data[i].topics[1].toString().slice(-40).toLowerCase();
            let owner   = '0x'+data[i].topics[2].toString().slice(-40).toLowerCase();
            let from    = '0x'+data[i].topics[3].toString().slice(-40).toLowerCase();

            if(owner==this.wallet.address().toLowerCase())
              list.push({ key:address, owner:owner, from:from,
                          actions:{ link:this.wallet.option['network']['href']+"/address/"+address,
                                    contract:(address)=>{this.showContract(contract.key,address);}
                                  }});
            else {
              let index = list.findIndex(x=>x.from==owner);
              if(index>-1)
                list.splice(index,1);
            }
          }
          callback(list);
        });
      },
      _confirmContract() {
        if(this.wallet.web3&&this.wallet.address()) {
          let address   = '';
          let data      = null;
          switch (this.contract.key) {
            case KEYS['ERC20WALLET']['KEY']:    address   = window.config.address; data = this._erc20Wallet(address,this._json(this.json),this._json(this.data)); break;
            case KEYS['STORE_AVATAR']['KEY']:   address   = window.config.address; data = this._avatar(address,this._json(this.json),this._json(this.data)); break;
            case KEYS['BADGE']['KEY']:          address   = window.config.address; data = this._badge(address,this._json(this.json),this._json(this.data)); break;
            case KEYS['STORE_CONTENTS']['KEY']: address   = window.store.address; data = this._store(address,this._json(this.json),this._json(this.data));  break;
            case KEYS['PACK']['KEY']:           address   = window.store.address; data = this._pack(address,this._json(this.json),this._json(this.data));   break;
            case KEYS['CREATOR']['KEY']:        address   = window.store.address; data = this._creator(address,this._json(this.json),this._json(this.data));break;
          }

          //console.log(data);
          //console.log(this.wallet.contract[address].c.methods);

          if(data!=null)
            this._sendTx(address,this.contract.password,0,data);
        }
      },
      _erc20Wallet(address,json,data){
        let result = null;
        switch (this.contract.tab) {// 0 = create, 1 = owner, 2 = store, 3 = price, 4 = desc, 5 = readonly
          case 0:
            result  = this.wallet.contract[address].c.methods.wallet(this.wallet.web3.utils.bytesToHex(msgpack.encode(json))).encodeABI();
            break;
        }
        return result;
      },
      _avatar(address,json,data){
        let result = null;
        switch (this.contract.tab) {// 0 = create, 1 = owner, 2 = store, 3 = price, 4 = desc, 5 = readonly
          case 0:
            result  = this.wallet.contract[address].c.methods.store(this.wallet.web3.utils.bytesToHex(msgpack.encode(json)),
                                                                    data.erc20,
                                                                    data.price?this.wallet.web3.utils.toWei(data.price,'ether'):0,
                                                                    data.stamp?data.stamp:0).encodeABI();
            break;
        }
        return result;
      },
      _badge(address,json,data) {
        switch (this.contract.tab) {// 0 = create, 1 = owner, 2 = store, 3 = price, 4 = desc, 5 = readonly
          case 0:
            result  = this.wallet.contract[address].c.methods.badge(this.wallet.web3.utils.bytesToHex(msgpack.encode(json))).encodeABI();
            break;
        }
        return result;
      },
      _store(address,json,data){
        let result = null;
        switch (this.contract.tab) {// 0 = create, 1 = owner, 2 = store, 3 = price, 4 = desc, 5 = readonly
          case 0:
            result  = this.wallet.contract[address].c.methods.store(this.wallet.web3.utils.bytesToHex(msgpack.encode(json)),
                                                                    data.erc20).encodeABI();
            break;
        }
        return result;
      },
      _pack(address,json,data){
        let result = null;
        switch (this.contract.tab) {// 0 = create, 1 = owner, 2 = store, 3 = price, 4 = desc, 5 = readonly
          case 0:
            result  = this.wallet.contract[address].c.methods.pack( this.wallet.web3.utils.bytesToHex(msgpack.encode(json)),
                                                                    data.creator,
                                                                    data.store,
                                                                    data.share?data.share:0,
                                                                    data.shareStart?data.shareStart:0).encodeABI();
            break;
        }
        return result;
      },
      _creator(address,json,data){
        let result = null;
        switch (this.contract.tab) {// 0 = create, 1 = owner, 2 = store, 3 = price, 4 = desc, 5 = readonly
          case 0:
            result = this.wallet.contract[address].c.methods.creator(this.wallet.web3.utils.bytesToHex(msgpack.encode(json))).encodeABI();
            break;
        }
        return result;
      },
      //------------------------------------------------------------------------------------------------
      _sendTx(address,password,value,data) {
        if(data!=null)
          this.wallet.sendTx(address,password,value,data,(e)=>{this.contract.state=false;this.contract.message=e;},(h)=>{this.contract.state=true;this.contract.message="Tx:"+h;},(r)=>{this.contract.state=true;this.contract.message="Success";});
      },
      //------------------------------------------------------------------------------------------------
      showContractList(key) {
        this.showModal("List of your "+KEYS[key]['TITLE'],"md",'dark','now loading...');
        let contract = {address:'',topic0:'',key:key};
        switch (key) {
          case KEYS['ERC20WALLET']['KEY']:
            contract['address'] = window.config.address;
            contract['topic0']  = this.wallet.findABI(window.config.manager,'WALLET')['signature'];
            break;
          case KEYS['STORE_AVATAR']['KEY']:
            contract['address'] = window.config.address;
            contract['topic0']  = this.wallet.findABI(window.config.manager,'STORE')['signature'];
            break;
          case KEYS['BADGE']['KEY']:
            contract['address'] = window.config.address;
            contract['topic0']  = this.wallet.findABI(window.config.manager,'BADGE')['signature'];
            break;
          case KEYS['STORE_CONTENTS']['KEY']:
            contract['address'] = window.store.address;
            contract['topic0']  = this.wallet.findABI(window.store.manager,'STORE')['signature'];
            break;
          case KEYS['PACK']['KEY']:
            contract['address'] = window.store.address;
            contract['topic0']  = this.wallet.findABI(window.store.manager,'PACK')['signature'];
            break;
          case KEYS['CREATOR']['KEY']:
            contract['address'] = window.store.address;
            contract['topic0']  = this.wallet.findABI(window.store.manager,'CREATOR')['signature'];
            break;
        }

        if(contract['address']!=''&&contract['topic0'])
          this._searchOwner(contract,(list)=>{this.updateModal(list.length==0?'Empty':'',list);});
      },
      //------------------------------------------------------------------------------------------------
      showContract(key,address,error=null,success=null) {
        this.contract.title       = (address==''?"Create ":"Contract ")+KEYS[key]['TITLE'];
        this.contract.address     = address;
        this.contract.link        = this.wallet.isAddress(address)?this.wallet.option['network']['href']+"/address/"+address:'#';
        this.contract.communities = false;
        this.contract.tab         = this.wallet.web3&&this.wallet.address()?(address==''?0:5):5;
        this.contract.key         = key;
        this.contract.state       = true;
        this.contract.message     = '';
        this.contract.password    = '';

        this._resetData();

        if(this.wallet.web3&&this.wallet.isAddress(address)) {
          switch (key) {
            case KEYS['ERC20WALLET']['KEY']:    this.showErc20Wallet(key,address,error,success); break;
            case KEYS['STORE_AVATAR']['KEY']:   this.showAvatar(key,address,error,success); break;
            case KEYS['BADGE']['KEY']:          this.showBadge(key,address,error,success); break;
            case KEYS['STORE_CONTENTS']['KEY']: this.showStore(key,address,error,success); break;
            case KEYS['PACK']['KEY']:           this.showPack(key,address,error,success); break;
            case KEYS['CREATOR']['KEY']:        this.showCreator(key,address,error,success); break;
          }
        } else if(address=='')
          this.$refs.refModalContract.show();
      },
      showErc20Wallet(key,address,error=null,success=null) {
        this._showContract(key,address,this.wallet.contract[window.config.address].c.methods.isWallet(address),this.wallet.findABI(window.config.wallet,'INFO'),
          (r,json)=>{
            this.data.owner = r;
            if(!success)
              this.$refs.refModalContract.show();
        });
      },
      showAvatar(key,address,error=null,success=null) {
        this._showContract(key,address,this.wallet.contract[window.config.address].c.methods.about(address),this.wallet.findABI(window.config.avatar,'INFO'),
          (r,json)=>{
            this.data.owner = r[0];
            this.data.erc20 = r[2];
            this.data.price = this.wallet.web3.utils.fromWei(r[3].toString(),'ether');
            this.data.stamp = parseInt(r[4]);
            if(!success)
              this.$refs.refModalContract.show();
        });
      },
      showBadge(key,address,error=null,success=null) {
        this._showContract(key,address,this.wallet.contract[window.config.address].c.methods.status(address,this.wallet.address()),this.wallet.findABI(window.config.badge,'INFO'),
          (r,json)=>{
            this.data.owner = r[0];
            //this.data.updater = r[1];
            if(!success)
              this.$refs.refModalContract.show();
        });
      },
      showStore(key,address,error=null,success=null) {
        let temp = new this.wallet.web3.eth.Contract(window.store.store,address);
        this._showContract(key,address,temp.methods.about(),this.wallet.findABI(window.store.store,'INFO'),
          (r,json)=>{
            this.data.owner = r[0];
            //  = r[1];// copyright
            this.data.erc20 = r[2];
            if(!success)
              this.$refs.refModalContract.show();
        });
      },
      showPack(key,address,error=null,success=null) {
        let temp = new this.wallet.web3.eth.Contract(window.store.pack,address);
        this._showContract(key,address,temp.methods.about(),this.wallet.findABI(window.store.pack,'INFO'),
          (r,json)=>{
            this.data.owner = r[0];
            //  = r[1];// copyright
            if(!success)
              this.$refs.refModalContract.show();
        });
      },
      showCreator(key,address,error=null,success=null) {
        let temp = new this.wallet.web3.eth.Contract(window.store.creator,address);
        this._showContract(key,address,temp.methods.about(),this.wallet.findABI(window.store.creator,'INFO'),
          (r,json)=>{
            this.data.owner = r[0];
            //  = r[1];// copyright
            if(!success)
              this.$refs.refModalContract.show();
        });
      },
      _showContract(key,address,contract,abi=null,callback=null) {
        if(!abi)
          return;
        contract.call((e,r)=>{
          if(!e){
            let topics    = 'topic0='+this.wallet.web3.eth.abi.encodeEventSignature(abi);
            this.wallet.logs(address,topics,(data)=>{
              if(data.length>0) {
                let temp    = this.wallet.web3.eth.abi.decodeLog(abi['inputs'],data[data.length-1].data,data[data.length-1].topics);
                let json    = msgpack.decode(this.wallet.web3.utils.hexToBytes(temp['_msgPack']));

                for (var key in json)
                  if(json[key]!='')
                    this.json[key] = json[key];

                if(callback)
                  callback(r,json);
              }
            });
          }
        });
      },
      //------------------------------------------------------------------------------------------------
      list(key) {
        if(this.wallet.web3&&this.wallet.address())
          this.showContractList(key);
      },
      contract2(key,address='') {
        this.showContract(key,address,(r)=>{this.state=false;this.message=r;}/*,(r)=>{this.state=true;this.message=r;}*/); // todo : <<-----
      },
      showAvatarEditor(address) {
        if(this.wallet.isAddress(address))
          this.$refs.editorModal.showModal(address);
      },
      about(key,address) {
        if(this.wallet.isAddress(address))
          this.contract2(key,address);
      }
      //------------------------------------------------------------------------------------------------
    }
  }
</script>
