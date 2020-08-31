<a name="top"></a>
# Service @microfleet/apidoc-plugin-json-schema v0.0.0



- [withReference](#withReference)
	- [](#)
	
- [zSchemaDefinitions](#zSchemaDefinitions)
	- [common](#common)
	


# <a name='withReference'></a> withReference
## <a name=''></a> 
<p>api schema with reference</p>

Source: [/sample/src/with-reference.js](/sample/src/with-reference.js).
```
GET /api/some-with-reference
```



### Response schema:

<a name="with-reference--"/>`{object}`<br>
Additional properties allowed: `true`<br>
Properties:

 - **myfield**
    [(common#/definitions/field)](#common--/definitions/field)
 - **secondField**
    [(request#)](#request--)
 - **otherField**
    [(#/definitions/other-field)](#with-reference--/definitions/other-field)

**Definitions**:

 - **with-reference#/definitions/other-field**
    <a name="with-reference--/definitions/other-field"/>`{number}`<br>
    <br>





**[⬆ Back to Top](#top)**
# <a name='zSchemaDefinitions'></a> zSchemaDefinitions
## <a name='common'></a> common
Source: [common.json](common.json).
```
SCHEMA common
```



### Schema

<a name="common--"/>

**Definitions**:


 - **common#/definitions/field**
    <a name="common--/definitions/field"/>`{string}`<br>
    
    sample string definition
    
    <br>



**[⬆ Back to Top](#top)**
