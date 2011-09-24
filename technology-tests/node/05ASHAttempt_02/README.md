# ASH
## API
On the exported global variable ASH, there are the following methods:
### registerPlugin()
Args:
 -   plugin An object expected to contain the following members:
 --   type A string ID of the resource type provided by this plugin.
 --   create A factory method for creating resource instances. This function takes one argument, the ID of the resource being created.
### genResourceID()
Generates a unique resource ID.
### set()
Args:
 - 
Args:
 - resource A string resource ID.
 - property A string property ID.
 - value A string value.
 
### TYPE
The property ID used for the type property.
